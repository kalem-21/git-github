import bcrypt from 'bcryptjs';
import { SignJWT, jwtVerify } from 'jose';

const DEMO_SECRET='ege-diagnostik-preview-session-secret-2026-only-demo-mode';
export function authReady(){return Boolean(process.env.AUTH_SECRET&&process.env.AUTH_SECRET.length>=32)}
function secret(){const text=authReady()?process.env.AUTH_SECRET:DEMO_SECRET;return new TextEncoder().encode(text)}
export async function hashPassword(password){return bcrypt.hash(password,12)}
export async function verifyPassword(password,hash){return bcrypt.compare(password,hash)}
export async function createSession(user){return new SignJWT({sub:String(user.id),role:user.role_slug,name:`${user.first_name} ${user.last_name}`,demo:Boolean(user.demo)}).setProtectedHeader({alg:'HS256'}).setIssuedAt().setExpirationTime('8h').setIssuer('egediagnostik-web').setAudience('egediagnostik-users').sign(secret())}
export async function readSession(token){const {payload}=await jwtVerify(token,secret(),{issuer:'egediagnostik-web',audience:'egediagnostik-users'});return payload}
export function sessionCookie(token){return `ege_session=${token}; HttpOnly; Secure; SameSite=Lax; Path=/; Max-Age=28800`}
