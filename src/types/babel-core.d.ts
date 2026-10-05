declare module '@babel/core' {
  export interface BabelFileResult {
    code?: string | null;
    map?: unknown;
  }
  export function transformSync(
    code: string,
    opts?: {
      filename?: string;
      plugins?: unknown[];
      parserOpts?: {
        plugins?: string[];
      };
    },
  ): BabelFileResult | null;
}
