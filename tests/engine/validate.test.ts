/** 每个战役包都通过离线校验（错误为 0）；警告由 npm run validate 列出供人工复核。 */
import { describe, it, expect } from 'vitest';
import { listCampaignIds } from '../../tools/lib/campaign-node';
import { validateCampaign } from '../../tools/validate/validate';

describe.each(listCampaignIds())('%s', (id) => {
  it('校验无错误', () => {
    expect(validateCampaign(id).errors).toEqual([]);
  });
});
