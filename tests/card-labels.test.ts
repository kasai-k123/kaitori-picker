import test from 'node:test';
import assert from 'node:assert/strict';
import { courses, minimumLabel, shippingLabel, boxLabel } from '../src/lib/data';
const course = (id: string) => courses.find(c => c.id === id)!;
test('カテゴリ変更で最低点数を切り替え、未選択と未確認を区別する', () => {
  const bookoff = course('bookoff/general');
  assert.equal(minimumLabel(bookoff, null), '商品によって異なります');
  assert.equal(minimumLabel(bookoff, 'books_manga'), '本・漫画：10点以上');
  assert.equal(minimumLabel(bookoff, 'brand_bag_wallet'), 'ブランドバッグ・財布：1点以上');
  assert.equal(minimumLabel(course('netoff/books-games'), 'game_console'), 'ゲーム機本体：最低点数は要確認');
  assert.equal(minimumLabel(course('pollet/general'), 'books_manga'), '本・漫画：取扱い・点数は要確認');
});
test('高額ソフトの1点例外を表示する', () => {
  for (const category of ['game_software', 'cd_dvd_bluray'] as const) {
    assert.match(minimumLabel(course('bookoff/general'), category), /通常3点以上（対象ソフトは買取価格1,000円以上なら1点から）/);
  }
});
test('発送送料は返送料と区別し、Polletの送料充当条件を表示する', () => {
  assert.equal(shippingLabel(course('bookoff/general')), '無料');
  assert.equal(shippingLabel(course('pollet/general')), '初回無料。2回目以降、査定額500円未満は受取0円（送料に充当・追加請求なし）');
  assert.equal(boxLabel(course('kaitoriouji/general')), '無料');
  assert.equal(boxLabel(course('bookoff/general')), '自分で用意／購入は1箱200円');
  assert.equal(boxLabel(course('pollet/general')), '箱の提供条件は要確認');
});
