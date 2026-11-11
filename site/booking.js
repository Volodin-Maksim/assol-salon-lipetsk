'use strict';
(() => {
  const dialog = document.getElementById('booking');
  if (!dialog) return;
  const content = document.getElementById('booking-content');
  const next = dialog.querySelector('.booking-next');
  const back = dialog.querySelector('.booking-back');
  const closeButton = dialog.querySelector('.dialog-close');
  const message = dialog.querySelector('.booking-message');
  const availability = document.getElementById('booking-availability');
  const arrow = '<svg class="arrow" viewBox="0 0 24 24" aria-hidden="true"><path d="M5 19 19 5M5 5h14v14"/></svg>';
  const escape = value => String(value ?? '').replace(/[&<>"']/g, character => ({'&':'&amp;','<':'&lt;','>':'&gt;','"':'&quot;',"'":'&#39;'}[character]));
  const today = () => new Intl.DateTimeFormat('sv-SE', { timeZone: 'Europe/Moscow', year: 'numeric', month: '2-digit', day: '2-digit' }).format(new Date());
  const lastDate = () => { const date = new Date(`${today()}T12:00:00Z`); date.setUTCDate(date.getUTCDate() + 30); return date.toISOString().slice(0,10); };
  const nowMoscow = () => new Intl.DateTimeFormat('sv-SE',{timeZone:'Europe/Moscow',hour:'2-digit',minute:'2-digit',hour12:false}).format(new Date());
  const pastSlot = time => state.date === today() && time <= nowMoscow();
  const times = Array.from({length:20}, (_, index) => `${String(9 + Math.floor(index / 2)).padStart(2,'0')}:${index % 2 ? '30' : '00'}`);
  let config, step = 0, state = {}, trigger, pending = false, loaded, opening = false;
  const load = () => loaded ||= fetch('booking-config.json', { cache:'no-store' }).then(response => { if (!response.ok) throw new Error(); return response.json(); }).then(value => { config = value; return value; });
  const service = () => config.services.find(item => item.id === state.service);
  const master = () => config.masters.find(item => item.id === state.master);
  const option = (group, item) => `<label class="booking-option${state[group] === item.id ? ' selected' : ''}"><input type="radio" name="${group}" value="${escape(item.id)}"${state[group] === item.id ? ' checked' : ''}><span><strong>${escape(item.name)}</strong>${item.description ? `<small>${escape(item.description)}</small>` : ''}</span>${item.price ? `<b>${escape(item.price)}</b>` : ''}</label>`;
  const dateLabel = () => state.date ? new Intl.DateTimeFormat('ru-RU',{day:'numeric',month:'long'}).format(new Date(`${state.date}T12:00:00Z`)) : '';
  function render(focus = true) {
    message.textContent = '';
    dialog.querySelectorAll('.booking-progress li').forEach((element, index) => { element.classList.toggle('current',index === step); element.classList.toggle('done',index < step); index === step ? element.setAttribute('aria-current','step') : element.removeAttribute('aria-current'); });
    back.hidden = step === 0 || step === 4;
    next.hidden = step === 4;
    next.disabled = false;
    next.innerHTML = (step === 3 ? 'Отправить заявку ' : 'Далее ') + arrow;
    if (step === 0) content.innerHTML = `<h2 id="booking-title" tabindex="-1">С чего начнём?</h2><p class="booking-lead">Выберите услугу. Детали и итоговую стоимость обсудим перед визитом.</p><fieldset class="booking-options"><legend class="sr-only">Услуга</legend>${config.services.map(item => option('service',item)).join('')}</fieldset>`;
    if (step === 1) content.innerHTML = `<h2 id="booking-title" tabindex="-1">К кому запишемся?</h2><p class="booking-lead">Выберите своего мастера или доверьте выбор нам.</p><fieldset class="booking-options"><legend class="sr-only">Мастер</legend>${config.masters.map(item => option('master',item)).join('')}</fieldset>`;
    if (step === 2) content.innerHTML = `<h2 id="booking-title" tabindex="-1">Когда вам удобно?</h2><p class="booking-lead">Укажите пожелания по дате и времени. Администратор подтвердит свободное время после получения заявки.</p><label class="booking-field">Дата<input type="date" id="booking-date" name="date" value="${escape(state.date)}" min="${today()}" max="${lastDate()}" required></label><fieldset class="booking-times"><legend>Удобное время</legend>${times.map(time => option('slot',{id:time,name:time})).join('')}</fieldset><p class="booking-date-hint">Время указано по Москве. Это пожелание к записи, а не подтверждённая бронь.</p>`;
    if (step === 3) {
      content.innerHTML = `<h2 id="booking-title" tabindex="-1">Оставьте контакты</h2><p class="booking-lead">Мы свяжемся с вами, чтобы подтвердить визит.</p><div class="booking-recap"><p><span>Услуга</span><b>${escape(service().name)}</b></p><p><span>Мастер</span><b>${escape(master().name)}</b></p><p><span>Когда</span><b>${dateLabel()} · ${state.slot}</b></p><p><span>Ориентир стоимости</span><b>${escape(service().price)}</b></p></div><form id="booking-details" novalidate><label class="booking-field">Ваше имя<input name="name" id="customer-name" autocomplete="name" maxlength="80" value="${escape(state.name)}" required aria-describedby="name-error"><span class="field-error" id="name-error"></span></label><label class="booking-field">Телефон<input name="phone" id="customer-phone" type="tel" inputmode="tel" autocomplete="tel" maxlength="24" placeholder="+7 999 123-45-67" value="${escape(state.phone)}" required aria-describedby="phone-error"><span class="field-error" id="phone-error"></span></label><label class="booking-field">Пожелания <span class="booking-small">· необязательно</span><textarea name="comment" id="customer-comment" maxlength="400" rows="2">${escape(state.comment)}</textarea></label><label class="booking-trap" aria-hidden="true">Компания<input name="company" tabindex="-1" autocomplete="off"></label><label class="booking-consent"><input name="consent" id="customer-consent" type="checkbox" ${state.consent ? 'checked' : ''} required><span>Согласен на обработку имени и телефона для связи по заявке. <a href="privacy.html" target="_blank" rel="noopener noreferrer">Условия обработки данных</a>.</span></label><span id="consent-error" class="field-error"></span></form><p class="booking-small">Заявка не подтверждает бронь автоматически. Время и стоимость согласует администратор.</p>`;
      next.disabled = !config.endpoint;
      content.querySelector('form').addEventListener('submit',event => { event.preventDefault(); submit(); });
      content.querySelector('#customer-phone').addEventListener('blur', event => { const value = normalizePhone(event.target.value); if (value) event.target.value = value; });
    }
    if (step === 4) {
      content.innerHTML = `<div class="booking-success"><svg viewBox="0 0 64 64" aria-hidden="true"><circle cx="32" cy="32" r="28"/><path d="m18 32 9 9 20-20"/></svg><h2 id="booking-title" tabindex="-1">Заявка<br>у нас.</h2><p>Спасибо, ${escape(state.name)}. Мы свяжемся с вами по указанному номеру и подтвердим время визита.</p><p class="booking-small">Номер заявки: ${escape(state.receipt)}</p><button class="pill dark" type="button" id="booking-finish">Вернуться на сайт ${arrow}</button></div>`;
      availability.hidden = true;
    }
    if (focus) content.querySelector('h2')?.focus();
    dialog.scrollTop = 0; content.scrollTop = 0;
  }
  function saveFields() {
    if (step === 2) state.date = content.querySelector('#booking-date')?.value || '';
    if (step === 3) {
      state.name = content.querySelector('#customer-name')?.value.trim() || '';
      state.phone = content.querySelector('#customer-phone')?.value || '';
      state.comment = content.querySelector('#customer-comment')?.value.trim() || '';
      state.consent = content.querySelector('#customer-consent')?.checked || false;
      state.company = content.querySelector('[name="company"]')?.value || '';
    }
  }
  function normalizePhone(value) { const digits = value.replace(/\D/g,''); return /^[78]\d{10}$/.test(digits) ? '+7' + digits.slice(1) : ''; }
  function validate() {
    saveFields();
    if (step === 0 && !state.service) { message.textContent='Выберите услугу.'; content.querySelector('input')?.focus(); return false; }
    if (step === 1 && !state.master) { message.textContent='Выберите мастера или вариант «Любой мастер».'; content.querySelector('input')?.focus(); return false; }
    if (step === 2 && (!state.date || state.date < today() || state.date > lastDate() || !times.includes(state.slot) || pastSlot(state.slot))) { message.textContent='Выберите дату в ближайшие 30 дней и удобное время.'; content.querySelector('#booking-date').focus(); return false; }
    if (step !== 3) return true;
    let first;
    for (const [id, errorId, valid, text] of [
      ['customer-name','name-error',state.name.length >= 2 && state.name.length <= 80 && /^[\p{L}\p{M}\s.'’\-]+$/u.test(state.name),'Укажите имя: от 2 до 80 букв.'],
      ['customer-phone','phone-error',Boolean(normalizePhone(state.phone)),'Укажите российский номер из 11 цифр, начиная с +7 или 8.'],
      ['customer-consent','consent-error',state.consent,'Подтвердите согласие на обработку данных.']
    ]) {
      const field=content.querySelector('#'+id); field.setAttribute('aria-invalid',String(!valid)); content.querySelector('#'+errorId).textContent=valid?'':text; if(!valid && !first)first=field;
    }
    if (first) { first.focus(); return false; }
    state.phone=normalizePhone(state.phone); return true;
  }
  async function submit() {
    if (pending || !validate()) return;
    if (!config.endpoint) { message.textContent='Онлайн-отправка пока недоступна. Ваши данные не отправлены.'; return; }
    pending=true; next.disabled=true; closeButton.disabled=true; back.disabled=true; next.textContent='Отправляем…'; message.textContent='';
    const controller=new AbortController();const timeout=setTimeout(()=>controller.abort(),20000);
    try {
      const payload={ requestId:state.requestId, service:state.service, master:state.master, date:state.date, time:state.slot, name:state.name, phone:state.phone, comment:state.comment||'', consent:'true', consentVersion:'assol-request-v1', company:state.company||'' };
      const response=await fetch(config.endpoint,{method:'POST',body:new URLSearchParams(payload),signal:controller.signal,redirect:'follow',credentials:'omit'});
      const result=await response.json();
      if (!response.ok || result.ok !== true || typeof result.bookingId !== 'string') throw new Error(result.code || 'DELIVERY_UNCONFIRMED');
      state.receipt=result.bookingId;step=4;render();
    } catch {
      message.textContent='Не удалось получить подтверждение отправки. Проверьте соединение и попробуйте ещё раз. Повторная отправка этой заявки не создаст дубликат.';
    } finally {clearTimeout(timeout);pending=false;next.disabled=!config.endpoint;closeButton.disabled=false;back.disabled=false;if(step!==4)next.innerHTML='Отправить заявку '+arrow;}
  }
  async function open(event) {
    if(opening||dialog.open)return;opening=true;
    const control=event.currentTarget; trigger=control;
    state={requestId:crypto.randomUUID(), service:control.dataset.service || '', master:'',date:'',slot:'',name:'',phone:'',comment:'',consent:false};step=state.service?1:0;
    try {
      await load();
      if (state.service && !config.services.some(item=>item.id===state.service)) {state.service='';step=0;}
      availability.hidden=Boolean(config.endpoint);
      availability.textContent=config.endpoint?'':'Онлайн-запись готовится к запуску. Пока можно выбрать пожелания, но отправка заявки ещё недоступна.';
      render(false);dialog.showModal();document.body.classList.add('dialog-open');content.querySelector('h2').focus();
    } catch {
      loaded=undefined;availability.hidden=false;availability.textContent='Не удалось загрузить форму. Обновите страницу и попробуйте ещё раз.';content.innerHTML='<h2 id="booking-title" tabindex="-1">Попробуем ещё раз?</h2>';next.hidden=true;back.hidden=true;dialog.showModal();document.body.classList.add('dialog-open');closeButton.focus();
    } finally { opening=false; }
  }
  function close() {
    if (pending) {message.textContent='Заявка отправляется. Пожалуйста, дождитесь ответа.';return;}
    dialog.close();document.body.classList.remove('dialog-open');state={};content.innerHTML='';trigger?.focus();
  }
  document.querySelectorAll('[data-book]').forEach(control=>control.addEventListener('click',open));
  content.addEventListener('change',event=>{if(event.target.id==='booking-date'){state.date=event.target.value;if(state.slot&&pastSlot(state.slot))state.slot='';render(false);content.querySelector('#booking-date').focus();return;}if(event.target.matches('input[type="radio"]')){state[event.target.name]=event.target.value;content.querySelectorAll(`input[name="${event.target.name}"]`).forEach(input=>input.closest('label').classList.toggle('selected',input.checked));message.textContent='';}});
  content.addEventListener('click',event=>{if(event.target.closest('#booking-finish'))close();});
  next.addEventListener('click',()=>{if(step===3){content.querySelector('form')?.requestSubmit();return;}if(validate()){step++;render();}});
  back.addEventListener('click',()=>{if(step>0&&!pending){saveFields();step--;render();}});
  closeButton.addEventListener('click',close);
  dialog.addEventListener('cancel',event=>{event.preventDefault();close();});
  dialog.addEventListener('click',event=>{if(event.target!==dialog)return;const box=dialog.getBoundingClientRect();if(event.clientX<box.left||event.clientX>box.right||event.clientY<box.top||event.clientY>box.bottom)close();});
})();
