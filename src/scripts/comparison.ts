import { compare, type Filters } from '../lib/compare';
import { type Category } from '../lib/data';
import { track } from './analytics';
const form = document.querySelector<HTMLFormElement>('#comparison-form');
if (form) {
  const list = document.querySelector<HTMLElement>('#course-list')!;
  const cards = new Map(Array.from(list.querySelectorAll<HTMLElement>('[data-course-id]')).map(card => [card.dataset.courseId!, card]));
  function update(interaction = false) {
    const error = document.querySelector<HTMLElement>('#form-error')!;
    if (!form!.checkValidity()) { error.hidden = false; error.textContent = '点数は1〜9999の整数で入力してください。'; return; }
    error.hidden = true;
    const values = new FormData(form!);
    const filters: Filters = {
      itemCategory: (values.get('itemCategory') || null) as Category | null,
      itemCount: values.get('itemCount') ? Number(values.get('itemCount')) : null,
      payment: values.get('payment') as Filters['payment'], freeReturn: values.get('freeReturn') as Filters['freeReturn']
    };
    const results = compare(filters);
    cards.forEach(card => { card.hidden = true; });
    results.forEach(result => {
      const card = cards.get(result.course.id)!;
      card.hidden = false;
      const badge = card.querySelector<HTMLElement>('[data-status]')!;
      badge.textContent = result.status === 'yes' ? '条件に合う' : '確認が必要';
      badge.classList.toggle('unknown', result.status === 'unknown');
      const reasons = card.querySelector<HTMLElement>('[data-reasons]')!;
      reasons.replaceChildren(...result.reasons.map(reason => { const li = document.createElement('li'); li.textContent = reason; return li; }));
      reasons.hidden = result.reasons.length === 0;
      list.append(card);
    });
    document.querySelector('#result-count')!.textContent = `条件に合う ${results.filter(r => r.status === 'yes').length}件 ／ 確認が必要 ${results.filter(r => r.status === 'unknown').length}件`;
    document.querySelector<HTMLElement>('#empty-results')!.hidden = results.length !== 0;
    if (interaction) track('comparison_interaction');
  }
  form.addEventListener('submit', event => event.preventDefault());
  form.addEventListener('change', () => update(true));
  form.addEventListener('reset', () => setTimeout(() => update(true), 0));
  update();
}
