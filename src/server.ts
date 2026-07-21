import app from './app';
import { ENV } from './config/env';

const PORT = ENV.PORT || 5000;

app.listen(PORT, () => {
  console.log(`==========================================`);
  console.log(`🚀 SERVER SIKILAT V2 MENYALA!`);
  console.log(`🛡️  Security  : Helmet, CORS, Limiter Active`);
  console.log(`🌐 Mode      : ${ENV.NODE_ENV}`);
  console.log(`🔗 URL       : http://localhost:${PORT}`);
  console.log(`==========================================`);
});