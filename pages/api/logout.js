export default function handler(req, res) {
    res.setHeader('Set-Cookie', [
      'authToken=; Path=/; HttpOnly; Max-Age=0; SameSite=Lax',
      'uid=; Path=/; Max-Age=0; SameSite=Lax',
      'isAdmin=; Path=/; Max-Age=0; SameSite=Lax',
      'workerId=; Path=/; Max-Age=0; SameSite=Lax',
      'customToken=; Path=/; Max-Age=0; SameSite=Lax',
    ]);
    res.status(200).json({ message: 'Logout successful' });
  }
// export default function handler(req, res) {
//     res.setHeader('Set-Cookie', 'authToken=; Path=/; HttpOnly; Max-Age=0');
//     res.status(200).json({ message: 'Logout successful' });
//   }
  