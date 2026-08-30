import crypto from 'crypto';

const jwksCache = new Map();

const base64UrlDecode = (value) => {
  const normalized = value.replace(/-/g, '+').replace(/_/g, '/');
  return Buffer.from(normalized, 'base64').toString('utf8');
};

const parseJwt = (token) => {
  const [header, payload, signature] = token.split('.');
  if (!header || !payload || !signature) {
    throw new Error('Invalid token format');
  }

  return {
    header: JSON.parse(base64UrlDecode(header)),
    payload: JSON.parse(base64UrlDecode(payload)),
    signedContent: `${header}.${payload}`,
    signature,
  };
};

const getJwks = async () => {
  const jwksUri = process.env.OIDC_JWKS_URI;
  if (!jwksUri) throw new Error('OIDC_JWKS_URI is not configured');

  const cached = jwksCache.get(jwksUri);
  if (cached && cached.expiresAt > Date.now()) return cached.keys;

  const response = await fetch(jwksUri);
  if (!response.ok) throw new Error('Failed to fetch OIDC JWKS');

  const { keys } = await response.json();
  jwksCache.set(jwksUri, {
    keys,
    expiresAt: Date.now() + 60 * 60 * 1000,
  });

  return keys;
};

const verifyAudience = (audience, expectedAudience) => (
  Array.isArray(audience)
    ? audience.includes(expectedAudience)
    : audience === expectedAudience
);

export const isOidcConfigured = () => Boolean(
  process.env.OIDC_ISSUER && process.env.OIDC_AUDIENCE && process.env.OIDC_JWKS_URI
);

export const verifyOidcToken = async (token) => {
  const { header, payload, signedContent, signature } = parseJwt(token);

  if (header.alg !== 'RS256') throw new Error('Unsupported OIDC token algorithm');
  if (payload.iss !== process.env.OIDC_ISSUER) throw new Error('Invalid OIDC issuer');
  if (!verifyAudience(payload.aud, process.env.OIDC_AUDIENCE)) throw new Error('Invalid OIDC audience');
  if (!payload.exp || payload.exp * 1000 <= Date.now()) throw new Error('OIDC token expired');

  const keys = await getJwks();
  const jwk = keys.find((key) => key.kid === header.kid);
  if (!jwk) throw new Error('OIDC signing key not found');

  const keyObject = crypto.createPublicKey({ key: jwk, format: 'jwk' });
  const isValid = crypto.verify(
    'RSA-SHA256',
    Buffer.from(signedContent),
    keyObject,
    Buffer.from(signature.replace(/-/g, '+').replace(/_/g, '/'), 'base64')
  );

  if (!isValid) throw new Error('Invalid OIDC token signature');

  return {
    id: payload.sub,
    oidcSub: payload.sub,
    sub: payload.sub,
    email: payload.email || payload.emailAddress || payload.emailaddress || payload['http://wso2.org/claims/emailaddress'] || payload['http://wso2.org/claims/email'],
    username: payload.preferred_username || payload.username || payload.email?.split('@')[0] || payload.sub,
    name: payload.name || payload.email || payload.sub,
    role: payload.role || payload['https://devcanvas.example/role'] || 'STUDENT',
    tokenType: 'oidc',
  };
};
