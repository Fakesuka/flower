import { app } from './app';
import { config } from './config';
import { applyMigrations } from './migrate';
import { ensureDefaultAdmin } from './seed';

async function bootstrap() {
  await applyMigrations();
  await ensureDefaultAdmin();

  app.listen(config.port, () => {
    console.log(`API v1 listening on :${config.port}`);
  });
}

bootstrap().catch((err) => {
  console.error('Failed to start server', err);
  process.exit(1);
});
