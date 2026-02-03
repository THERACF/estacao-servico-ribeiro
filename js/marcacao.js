// ==============================
// Marcação - Validação + Envio (Formspree)
// UX: erros só no blur (ao sair do campo) e no submit
// Extras: validação de horário + borda verde quando válido
// Extras 2: minutos apenas 00/15/30/45 + arredondamento automático
// ==============================

const form = document.getElementById("bookingForm");
const alertBox = document.getElementById("bookingAlert");

const nome = document.getElementById("nome");
const email = document.getElementById("email");
const telefone = document.getElementById("telefone");
const servico = document.getElementById("servico");
const marca = document.getElementById("marca");
const modelo = document.getElementById("modelo");
const matricula = document.getElementById("matricula");
const dataHora = document.getElementById("dataHora");
const obs = document.getElementById("observacoes");

const errNome = document.getElementById("errNome");
const errEmail = document.getElementById("errEmail");
const errTelefone = document.getElementById("errTelefone");
const errServico = document.getElementById("errServico");
const errMarca = document.getElementById("errMarca");
const errModelo = document.getElementById("errModelo");
const errMatricula = document.getElementById("errMatricula");
const errDataHora = document.getElementById("errDataHora");
const errObs = document.getElementById("errObs");

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

function showError(input, errEl, msg) {
  input.classList.add("is-invalid");
  input.classList.remove("is-valid");
  errEl.textContent = msg;
  errEl.classList.remove("d-none");
}

function clearError(input, errEl) {
  input.classList.remove("is-invalid");
  errEl.textContent = "";
  errEl.classList.add("d-none");
}

function setValid(input) {
  input.classList.remove("is-invalid");
  input.classList.add("is-valid");
}

function clearValid(input) {
  input.classList.remove("is-valid");
}

// ==============================
// Validadores básicos
// ==============================
function isValidEmail(v) {
  return /^[^\s@]+@[^\s@]+\.[^\s@]{2,}$/.test(v.trim());
}

function isValidPhonePT(v) {
  const digits = v.replace(/\s+/g, "");
  return /^(\+351)?9\d{8}$/.test(digits);
}

// Matrícula PT (opcional)
function isValidMatriculaPT(v) {
  const s = v.trim().toUpperCase();
  if (s === "") return true;

  const clean = s.replace(/\s+/g, "");
  const re1 = /^[0-9]{2}-?[A-Z]{2}-?[0-9]{2}$/; // 12-AB-34
  const re2 = /^[A-Z]{2}-?[0-9]{2}-?[A-Z]{2}$/; // AB-12-CD
  const re3 = /^[0-9]{2}-?[0-9]{2}-?[A-Z]{2}$/; // 12-34-AB

  return re1.test(clean) || re2.test(clean) || re3.test(clean);
}

function toLocalDateTimeInputValue(d) {
  const pad = (n) => String(n).padStart(2, "0");
  const yyyy = d.getFullYear();
  const mm = pad(d.getMonth() + 1);
  const dd = pad(d.getDate());
  const hh = pad(d.getHours());
  const mi = pad(d.getMinutes());
  return `${yyyy}-${mm}-${dd}T${hh}:${mi}`;
}

// min para não deixar marcar no passado
(function setMinDateTime() {
  const now = new Date();
  now.setMinutes(now.getMinutes() + 10);
  dataHora.min = toLocalDateTimeInputValue(now);
})();

// ==============================
// Validação de horário da oficina
// Regras:
// - Seg–Sex: 08:30–19:00
// - Sábado:  08:30–13:00
// - Domingo: fechado
// - Pausa almoço: 12:30–14:00
// ==============================
function isWithinBusinessHours(dateObj) {
  const day = dateObj.getDay(); // 0=Dom, 1=Seg, ... 6=Sáb
  const minutes = dateObj.getHours() * 60 + dateObj.getMinutes();

  // Domingo fechado
  if (day === 0) return { ok: false, msg: "Ao domingo estamos encerrados. Escolha outro dia." };

  // Pausa almoço
  const lunchStart = 12 * 60 + 30; // 12:30
  const lunchEnd = 14 * 60;        // 14:00
  if (minutes >= lunchStart && minutes < lunchEnd) {
    return { ok: false, msg: "Entre as 12:30 e as 14:00 estamos em pausa. Escolha outro horário." };
  }

  // Sábado
  if (day === 6) {
    const open = 8 * 60 + 30;  // 08:30
    const close = 13 * 60;     // 13:00
    if (minutes < open || minutes > close) {
      return { ok: false, msg: "Ao sábado, o horário é 08:30–13:00." };
    }
    return { ok: true, msg: "" };
  }

  // Seg–Sex
  const open = 8 * 60 + 30;   // 08:30
  const close = 19 * 60;      // 19:00
  if (minutes < open || minutes > close) {
    return { ok: false, msg: "De segunda a sexta, o horário é 08:30–19:00 (com pausa 12:30–14:00)." };
  }

  return { ok: true, msg: "" };
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
        clearValid(nome);
        if (canShow) showError(nome, errNome, "Indique o seu nome (mín. 2 caracteres).");
        return false;
      }
      clearError(nome, errNome);
      setValid(nome);
      return true;
    }

    case "email": {
      const v = email.value.trim();
      const ok = v !== "" && isValidEmail(v);
      if (!ok) {
        clearValid(email);
        if (canShow) showError(email, errEmail, v === "" ? "Indique o seu email." : "Indique um email válido.");
        return false;
      }
      clearError(email, errEmail);
      setValid(email);
      return true;
    }

    case "telefone": {
      const v = telefone.value.trim();
      const ok = v !== "" && isValidPhonePT(v);
      if (!ok) {
        clearValid(telefone);
        if (canShow) showError(telefone, errTelefone, v === "" ? "Indique o seu número." : "Número inválido (ex.: 9xx xxx xxx).");
        return false;
      }
      clearError(telefone, errTelefone);
      setValid(telefone);
      return true;
    }

    case "servico": {
      const ok = !!servico.value;
      if (!ok) {
        clearValid(servico);
        if (canShow) showError(servico, errServico, "Escolha o tipo de serviço.");
        return false;
      }
      clearError(servico, errServico);
      setValid(servico);
      return true;
    }

    case "marca": {
      const ok = marca.value.trim().length >= 2;
      if (!ok) {
        clearValid(marca);
        if (canShow) showError(marca, errMarca, "Indique a marca (mín. 2 caracteres).");
        return false;
      }
      clearError(marca, errMarca);
      setValid(marca);
      return true;
    }

    case "modelo": {
      const ok = modelo.value.trim().length >= 1;
      if (!ok) {
        clearValid(modelo);
        if (canShow) showError(modelo, errModelo, "Indique o modelo do carro.");
        return false;
      }
      clearError(modelo, errModelo);
      setValid(modelo);
      return true;
    }

    case "matricula": {
      const ok = isValidMatriculaPT(matricula.value);
      if (!ok) {
        clearValid(matricula);
        if (canShow) showError(matricula, errMatricula, "Matrícula inválida (ex.: 12-AB-34).");
        return false;
      }
      clearError(matricula, errMatricula);
      if (matricula.value.trim() !== "") setValid(matricula);
      else clearValid(matricula);
      return true;
    }

    case "dataHora": {
      if (!dataHora.value) {
        clearValid(dataHora);
        if (canShow) showError(dataHora, errDataHora, "Indique uma data e hora.");
        return false;
      }

      const chosen = new Date(dataHora.value);

      // ✅ evita erros quando o valor está inválido/incompleto
      if (isNaN(chosen.getTime())) {
        clearValid(dataHora);
        if (canShow) showError(dataHora, errDataHora, "Indique uma data e hora válida.");
        return false;
      }

      const now = new Date();

      if (chosen.getTime() <= now.getTime()) {
        clearValid(dataHora);
        if (canShow) showError(dataHora, errDataHora, "Escolha uma data/hora no futuro.");
        return false;
      }

      // ✅ primeiro: horário da oficina
      const bh = isWithinBusinessHours(chosen);
      if (!bh.ok) {
        clearValid(dataHora);
        if (canShow) showError(dataHora, errDataHora, bh.msg);
        return false;
      }

      // ✅ depois: minutos permitidos
      const m = chosen.getMinutes();
      if (![0, 15, 30, 45].includes(m)) {
        clearValid(dataHora);
        if (canShow) showError(dataHora, errDataHora, "Escolha um horário com minutos 00, 15, 30 ou 45.");
        return false;
      }

      clearError(dataHora, errDataHora);
      setValid(dataHora);
      return true;
    }

    case "observacoes": {
      const ok = obs.value.trim().length <= 500;
      if (!ok) {
        clearValid(obs);
        if (canShow) showError(obs, errObs, "Observações demasiado longas (máx. 500 caracteres).");
        return false;
      }
      clearError(obs, errObs);
      if (obs.value.trim() !== "") setValid(obs);
      else clearValid(obs);
      return true;
    }

    default:
      return true;
  }
}

function validateAllOnSubmit() {
  hideAlert();
  const ids = ["nome", "email", "telefone", "servico", "marca", "modelo", "matricula", "dataHora", "observacoes"];
  const results = ids.map((id) => validateField(id, "submit"));
  return results.every(Boolean);
}

// ==============================
// Eventos: erro só no blur, verde quando válido
// ==============================
function bindField(el, id, eventType = "input") {
  el.addEventListener(eventType, () => {
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
bindField(marca, "marca", "input");
bindField(modelo, "modelo", "input");
bindField(matricula, "matricula", "input");

bindField(servico, "servico", "change");
bindField(dataHora, "dataHora", "change");

bindField(obs, "observacoes", "input");

// ==============================
// Ajustar automaticamente os minutos para 00/15/30/45 (opção A)
// ==============================
function roundToQuarterHour(dtLocalValue) {
  if (!dtLocalValue) return "";

  const d = new Date(dtLocalValue);
  if (isNaN(d.getTime())) return ""; // não mexer se estiver inválido

  const m = d.getMinutes();
  const rounded = Math.round(m / 15) * 15;

  if (rounded === 60) {
    d.setHours(d.getHours() + 1);
    d.setMinutes(0);
  } else {
    d.setMinutes(rounded);
  }

  d.setSeconds(0);
  d.setMilliseconds(0);

  return toLocalDateTimeInputValue(d);
}

// Quando o utilizador escolhe data/hora, ajusta logo para 00/15/30/45
dataHora.addEventListener("change", () => {
  if (!dataHora.value) return;

  const newVal = roundToQuarterHour(dataHora.value);
  if (newVal) dataHora.value = newVal;

  // se o campo já foi tocado, atualiza a validação/verde
  if (touched.has("dataHora")) validateField("dataHora", "input");
});

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
      setAlert("success", "Pedido de marcação enviado! Vamos contactar para confirmar disponibilidade.");
      form.reset();

      touched.clear();

      [nome, email, telefone, servico, marca, modelo, matricula, dataHora, obs].forEach((el) => {
        el.classList.remove("is-invalid", "is-valid");
      });

      [errNome, errEmail, errTelefone, errServico, errMarca, errModelo, errMatricula, errDataHora, errObs].forEach((el) => {
        el.textContent = "";
        el.classList.add("d-none");
      });

      // voltar a definir min após reset
      const now = new Date();
      now.setMinutes(now.getMinutes() + 10);
      dataHora.min = toLocalDateTimeInputValue(now);
    } else {
      setAlert("danger", "Não foi possível enviar agora. Tente novamente mais tarde.");
    }
  } catch (err) {
    setAlert("danger", "Falha de ligação. Verifique a internet e tente novamente.");
  }
});
