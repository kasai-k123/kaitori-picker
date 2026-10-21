import { courses, type Course, type Category, type State } from './data';
export interface Filters {
  itemCategory: Category | null;
  itemCount: number | null;
  payment: 'any' | 'bank_direct_only';
  freeReturn: 'any' | 'free_after_appraisal';
}
export const defaults: Filters = { itemCategory: null, itemCount: null, payment: 'any', freeReturn: 'any' };
export function evaluate(course: Course, filters: Filters) {
  const states: State[] = [];
  const reasons: string[] = [];
  const add = (state: State, reason?: string) => { states.push(state); if (reason) reasons.push(reason); };
  const rule = filters.itemCategory ? course.categories[filters.itemCategory] : null;
  if (rule) {
    add(rule.state, rule.state === 'unknown' ? rule.note : undefined);
  }
  if (filters.itemCount !== null) {
    if (!Number.isInteger(filters.itemCount) || filters.itemCount < 1 || filters.itemCount > 9999) throw new RangeError('点数は1〜9999の整数で入力してください。');
    if (!rule) add('unknown', '売りたい物を選んでください。');
    else if (rule.state !== 'no') {
      if (rule.minItems === null) add('unknown', rule.state === 'unknown' ? undefined : '最低申込点数は要確認です。');
      else if (filters.itemCount < rule.minItems) {
        add(rule.reason === 'high_value_software_exception' ? 'unknown' : 'no', rule.reason === 'high_value_software_exception' ? '買取価格1,000円以上の対象ソフトは1点から申し込める場合があります。' : `通常は${rule.minItems}点以上が必要です。`);
      } else add('yes');
      if (rule.reason === 'category_max_20_cd_dvd' && filters.itemCount > 20) add('unknown', 'CD・DVDはそれぞれ20点までです。');
    }
  }
  if (filters.payment === 'bank_direct_only') add(course.payout.bankDirect ? 'yes' : 'no', course.payout.bankDirect ? undefined : '銀行への直接振込には対応していません。');
  if (filters.freeReturn === 'free_after_appraisal') {
    const free = course.fees.returnShippingAfterAppraisalRejection === 'free_if_manual_approval';
    add(free ? 'yes' : 'no');
  }
  const status: State = states.includes('no') ? 'no' : states.includes('unknown') ? 'unknown' : 'yes';
  return { course, status, reasons: [...new Set(reasons)] };
}
export function compare(filters: Filters) {
  return courses.map(course => evaluate(course, filters)).filter(result => result.status !== 'no').sort((a, b) => Number(a.status === 'unknown') - Number(b.status === 'unknown'));
}
