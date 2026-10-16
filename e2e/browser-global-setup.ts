import { assertBrowserReady } from './browser';

/** Production-status config has no API. It only needs a browser. */
export default async function browserGlobalSetup(): Promise<void> {
  await assertBrowserReady();
}
