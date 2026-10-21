import raw from '../data/kaitori-official-data-2026-10-21.json';
export type State = 'yes' | 'no' | 'unknown';
export type Category = keyof typeof raw.categoryLabels;
export interface CategoryRule { state: State; minItems: number | null; note?: string; reason?: string }
export type Course = Omit<(typeof raw.courses)[number], 'categories'> & { categories: Record<Category, CategoryRule> };
export const data = raw;
export const courses = raw.courses as Course[];
export const categories = Object.entries(raw.categoryLabels) as [Category, string][];
// Official and advertising destinations deliberately stay separate. MVP always uses official entry points.
export const applicationLink = (course: Course) => ({ url: course.applicationUrl, kind: 'official' as const });
export const returnLabel = (course: Course) => course.fees.returnShippingAfterAppraisalRejection === 'free_if_manual_approval' ? '無料（査定後のキャンセル時）' : '自己負担';
export const boxLabel = (course: Course) => ({ free: '無料', paid_option_200_yen: '自分で用意／購入は1箱200円', free_up_to_6_boxes: '6箱まで無料', free_or_unknown: '箱の提供条件は要確認' }[course.fees.packingBoxes]);
export function minimumLabel(course: Course, category: Category | null) {
  if (!category) return '商品によって異なります';
  const rule = course.categories[category];
  const prefix = `${data.categoryLabels[category]}：`;
  if (rule.state === 'no') return `${prefix}対象外`;
  if (rule.minItems === null) return `${prefix}${rule.state === 'unknown' ? '取扱い・点数は要確認' : '最低点数は要確認'}`;
  if (rule.reason === 'high_value_software_exception') return `${prefix}通常${rule.minItems}点以上（対象ソフトは買取価格1,000円以上なら1点から）`;
  return `${prefix}${rule.minItems}点以上${rule.state === 'unknown' ? '（対象商品は要確認）' : ''}`;
}
export const shippingLabel = (course: Course) => course.fees.outboundShipping === 'free' ? '無料' : '初回無料。2回目以降、査定額500円未満は受取0円（送料に充当・追加請求なし）';
