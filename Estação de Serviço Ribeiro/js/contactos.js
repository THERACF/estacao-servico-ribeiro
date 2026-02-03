// ==============================
// Contactos - Validação + Envio (Formspree)
// UX: erros só no blur (ao sair do campo) e no submit
// Extras: borda verde + valid-feedback quando válido
// ==============================

const form = document.getElementById("contactForm");
const alertBox = document.getElementById("formAlert");

const nome = document.getElementById("nome");
const email = document.getElementById("email");
const telefone = document.getElementById("telefone");
const assunto = document.getElementById("assunto");
const mensagem = document.getElementById("mensagem");

const errNome = document.getElementById("errNome");
const errEmail = document.getElementById("errEmail");
const errTelefone = document.getElementById("errTelefone");
const errAssunto = document.getElementById("errAssunto");
const errMensagem = document.getElementById("errMensagem");

// valid-feedback (Certo ✅)
const okNome = document.getElementById("okNome");
const okEmail = document.getElementById("okEmail");
const okTelefone = document.getElementById("okTelefone");
const okAssunto = document.getElementById("okAssunto");
const okMensagem = document.getElementById("okMensagem");

// Campos já “tocados”
const touched = new Set();

// ==============================
// Helpers UI
// ==============================
function setAlert(type, msg) {
  alertBox.className = `alert alert-${type}`;
  alertBox.textContent = msg;
  alertBox.classList.remove("d-none");
}

function hideAlert() {
  alertBox.classList.add("d-none");
}

function showError(input, errEl, okEl, msg) {
  input.classList.add("is-invalid");
  input.classList.remove("is-valid");

  errEl.textContent = msg;
  errEl.classList.remove("d-none");

  if (okEl) okEl.classList.add("d-none");
}

function clearError(input, errEl) {
  input.classList.remove("is-invalid");
  errEl.textContent = "";
  errEl.classList.add("d-none");
}

function setValid(input, okEl) {
  input.classList.remove("is-invalid");
  input.classList.add("is-valid");
  if (okEl) okEl.classList.remove("d-none");
}

function clearValid(input, okEl) {
  input.classList.remove("is-valid");
  if (okEl) okEl.classList.add("d-none");
}

// ==============================
// Validadores básicos
// ==============================
function isValidEmail(v) {
  return /^[^\s@]+@[^\s@]+\.[^\s@]{2,}$/.test(v.trim());
}

// Telefone PT: opcional (vazio é aceite)
// aceita 9xxxxxxxx e +3519xxxxxxxx (com ou sem espaços)
function isValidPhonePTOptional(v) {
  const digits = v.replace(/\s+/g, "");
  if (digits === "") return true;
  return /^(\+351)?9\d{8}$/.test(digits);
}

// ==============================
// Validação por campo
// mode:
// - "blur": pode mostrar erro
// - "input": NÃO mostra erro (só limpa/valida se já tocado)
// - "submit": mostra erro (validação total)
// ==============================
function validateField(fieldId, mode = "blur") {
  const canShow = mode === "blur" || mode === "submit";

  switch (fieldId) {
    case "nome": {
      const ok = nome.value.trim().length >= 2;
      if (!ok) {
        clearValid(nome, okNome);
        if (canShow) showError(nome, errNome, okNome, "Indique o seu nome (mín. 2 caracteres).");
        return false;
      }
      clearError(nome, errNome);
      setValid(nome, okNome);
      return true;
    }

    case "email": {
      const v = email.value.trim();
      const ok = v !== "" && isValidEmail(v);
      if (!ok) {
        clearValid(email, okEmail);
        if (canShow) showError(email, errEmail, okEmail, v === "" ? "Indique o seu email." : "Indique um email válido.");
        return false;
      }
      clearError(email, errEmail);
      setValid(email, okEmail);
      return true;
    }

    case "telefone": {
      const v = telefone.value.trim();
      const ok = isValidPhonePTOptional(v);

      if (!ok) {
        clearValid(telefone, okTelefone);
        if (canShow) showError(telefone, errTelefone, okTelefone, "Número inválido (ex.: 9xx xxx xxx ou +3519xxxxxxxx).");
        return false;
      }

      // Telefone é opcional:
      clearError(telefone, errTelefone);

      // Verde + certo só se tiver valor (se estiver vazio, fica neutro)
      if (v !== "") setValid(telefone, okTelefone);
      else clearValid(telefone, okTelefone);

      return true;
    }

    case "assunto": {
      const ok = !!assunto.value;
      if (!ok) {
        clearValid(assunto, okAssunto);
        if (canShow) showError(assunto, errAssunto, okAssunto, "Escolha um assunto.");
        return false;
      }
      clearError(assunto, errAssunto);
      setValid(assunto, okAssunto);
      return true;
    }

    case "mensagem": {
      const v = mensagem.value.trim();
      const ok = v.length >= 10;
      if (!ok) {
        clearValid(mensagem, okMensagem);
        if (canShow) showError(mensagem, errMensagem, okMensagem, "Escreva uma mensagem com pelo menos 10 caracteres.");
        return false;
      }
      clearError(mensagem, errMensagem);
      setValid(mensagem, okMensagem);
      return true;
    }

    default:
      return true;
  }
}

function validateAllOnSubmit() {
  hideAlert();
  const ids = ["nome", "email", "telefone", "assunto", "mensagem"];
  const results = ids.map((id) => validateField(id, "submit"));
  return results.every(Boolean);
}

// ==============================
// Eventos: erro só no blur, verde quando válido
// ==============================
function bindField(el, id, eventType = "input") {
  el.addEventListener(eventType, () => {
    // Durante input/change: só validar (e ficar verde) se o campo já foi tocado
    if (touched.has(id)) validateField(id, "input");
  });

  el.addEventListener("blur", () => {
    touched.add(id);
    validateField(id, "blur");
  });
}

bindField(nome, "nome", "input");
bindField(email, "email", "input");
bindField(telefone, "telefone", "input");
bindField(mensagem, "mensagem", "input");
bindField(assunto, "assunto", "change");

// ==============================
// Submit: valida tudo + envia
// ==============================
form.addEventListener("submit", async (e) => {
  e.preventDefault();

  if (!validateAllOnSubmit()) {
    setAlert("danger", "Verifique os campos assinalados antes de enviar.");
    return;
  }

  const endpoint = form.getAttribute("action");
  if (!endpoint || !endpoint.includes("formspree.io")) {
    setAlert("warning", "Falta configurar o endpoint do Formspree no atributo action do formulário.");
    return;
  }

  try {
    const formData = new FormData(form);

    const res = await fetch(endpoint, {
      method: "POST",
      body: formData,
      headers: { Accept: "application/json" },
    });

    if (res.ok) {
      setAlert("success", "Mensagem enviada com sucesso! Obrigado pelo contacto.");
      form.reset();

      // limpar estados
      touched.clear();

      // limpar classes
      [nome, email, telefone, assunto, mensagem].forEach((el) => {
        el.classList.remove("is-invalid", "is-valid");
      });

      // limpar erros
      [errNome, errEmail, errTelefone, errAssunto, errMensagem].forEach((el) => {
        el.textContent = "";
        el.classList.add("d-none");
      });

      // esconder "Certo ✅"
      [okNome, okEmail, okTelefone, okAssunto, okMensagem].forEach((el) => {
        if (el) el.classList.add("d-none");
      });
    } else {
      setAlert("danger", "Não foi possível enviar agora. Tente novamente mais tarde.");
    }
  } catch (err) {
    setAlert("danger", "Falha de ligação. Verifique a internet e tente novamente.");
  }
});
