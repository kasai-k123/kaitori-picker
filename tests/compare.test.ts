import test from 'node:test';
import assert from 'node:assert/strict';
import { compare, defaults, evaluate, type Filters } from '../src/lib/compare';
import { courses, applicationLink } from '../src/lib/data';
const result = (filters: Partial<Filters>) => compare({ ...defaults, ...filters });
const state = (id: string, filters: Partial<Filters>) => evaluate(courses.find(c => c.id === id)!, { ...defaults, ...filters }).status;
const ids = (filters: Partial<Filters>) => result(filters).map(r => r.course.id);
test('本5冊：王子・リコマース一致、ブックオフ・ネットオフ不一致、Pollet未確認', () => {
  const f = { itemCategory: 'books_manga', itemCount: 5 } as const;
  assert.deepEqual(ids(f), ['kaitoriouji/general', 'recommerce/general', 'pollet/general']);
  assert.equal(state('pollet/general', f), 'unknown');
  assert.equal(state('bookoff/general', f), 'no');
  assert.equal(state('netoff/books-games', f), 'no');
});
test('本5冊・銀行直接振込：ギフトと残高経由を除外', () => {
  assert.deepEqual(ids({ itemCategory: 'books_manga', itemCount: 5, payment: 'bank_direct_only' }), ['kaitoriouji/general']);
});
test('ゲームソフト1点：ブックオフは例外確認、ネットオフは不一致', () => {
  const f = { itemCategory: 'game_software', itemCount: 1 } as const;
  assert.equal(state('bookoff/general', f), 'unknown');
  assert.equal(state('netoff/books-games', f), 'no');
  assert.match(result(f).find(r => r.course.serviceId === 'bookoff')!.reasons.join(''), /1,000円/);
});
test('本30冊・返送料無料：王子とリコマースのみ', () => {
  assert.deepEqual(ids({ itemCategory: 'books_manga', itemCount: 30, freeReturn: 'free_after_appraisal' }), ['kaitoriouji/general', 'recommerce/general']);
});
test('ブランドバッグ1点・銀行・返送料無料：王子とネットオフ総合', () => {
  assert.deepEqual(ids({ itemCategory: 'brand_bag_wallet', itemCount: 1, payment: 'bank_direct_only', freeReturn: 'free_after_appraisal' }), ['kaitoriouji/general', 'netoff/brand-general']);
});
test('ゲーム機1点：ネットオフ本ゲームの最低点数はunknown', () => {
  assert.equal(state('netoff/books-games', { itemCategory: 'game_console', itemCount: 1 }), 'unknown');
});
test('点数未入力は点数条件を使わず、カテゴリなしの点数はunknown', () => {
  assert.equal(state('netoff/books-games', { itemCategory: 'game_console' }), 'yes');
  assert.equal(result({ itemCount: 1 }).every(r => r.status === 'unknown'), true);
  assert.equal(result({}).length, 6);
});
test('noはunknownに優先する', () => {
  assert.equal(state('pollet/general', { itemCategory: 'books_manga', itemCount: 5, payment: 'bank_direct_only' }), 'no');
  assert.equal(state('netoff/brand-general', { itemCategory: 'books_manga', itemCount: 1 }), 'no');
});
test('通常点数の境界と高額ソフトの例外', () => {
  for (const [id, category, minimum] of [['bookoff/general', 'books_manga', 10], ['netoff/books-games', 'books_manga', 30], ['netoff/books-games', 'game_software', 3]] as const) {
    assert.equal(state(id, { itemCategory: category, itemCount: minimum - 1 }), 'no');
    assert.equal(state(id, { itemCategory: category, itemCount: minimum }), 'yes');
  }
  for (const category of ['game_software', 'cd_dvd_bluray'] as const) {
    assert.equal(state('bookoff/general', { itemCategory: category, itemCount: 2 }), 'unknown');
    assert.equal(state('bookoff/general', { itemCategory: category, itemCount: 3 }), 'yes');
  }
});
test('Pollet統合ディスクカテゴリは20点・21点ともunknown、上限を説明', () => {
  for (const itemCount of [20, 21]) assert.equal(state('pollet/general', { itemCategory: 'cd_dvd_bluray', itemCount }), 'unknown');
  assert.match(result({ itemCategory: 'cd_dvd_bluray', itemCount: 21 }).find(r => r.course.serviceId === 'pollet')!.reasons.join(''), /それぞれ20点/);
});
test('フィギュアの未確認情報を維持', () => {
  for (const id of ['pollet/general', 'netoff/brand-general']) assert.equal(state(id, { itemCategory: 'figure_hobby' }), 'unknown');
});
test('yesを先に、同じ状態では元の順番を維持', () => {
  assert.deepEqual(ids({ itemCategory: 'game_software', itemCount: 1 }), ['kaitoriouji/general', 'recommerce/general', 'bookoff/general', 'pollet/general']);
});
test('不正な点数を拒否し、範囲の両端を許可', () => {
  for (const itemCount of [0, -1, 1.5, 10000, NaN, Infinity]) assert.throws(() => result({ itemCount }), RangeError);
  for (const itemCount of [1, 9999]) assert.doesNotThrow(() => result({ itemCount }));
});
test('広告リンクを公式申込リンクに混ぜない', () => {
  for (const course of courses) { assert.equal(course.affiliateUrl, null); assert.deepEqual(applicationLink(course), { url: course.applicationUrl, kind: 'official' }); }
});
