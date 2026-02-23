import { db } from './database';
import { runSchema } from './schema';
import { runSeed } from './seed';

runSchema();
runSeed();

export { db };
