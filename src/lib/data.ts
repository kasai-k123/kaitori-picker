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
export const returnLabel = (course: Course) => course.fees.returnShippingAfterAppraisalRejection === 'free_if_manual_approval' ? '無料（査定結果を確認してから断る場合）' : '自己負担';
export const boxLabel = (course: Course) => ({ free: '無料', paid_option_200_yen: '自分で用意／購入は1箱200円', free_up_to_6_boxes: '6箱まで無料', free_or_unknown: '無料の範囲・提供条件は要確認' }[course.fees.packingBoxes]);
