document.addEventListener("DOMContentLoaded", () => {

const $ = (sel) => document.querySelector(sel);
const $$ = (sel) => document.querySelectorAll(sel);

const btnDark = $("#btnDark");
const storage = {
  get: (k) => JSON.parse(localStorage.getItem(k)) || [],
  set: (k, v) => localStorage.setItem(k, JSON.stringify(v))
};

let editIndex = -1;

/* ===== DARK MODE ===== */
if (btnDark) {
  const isDarkSaved = localStorage.getItem("dark") === "true";
  document.body.classList.toggle("dark", isDarkSaved);
  btnDark.innerHTML = isDarkSaved ? '<i class="fas fa-sun"></i>' : '<i class="fas fa-moon"></i>';

  btnDark.addEventListener("click", () => {
    const isDark = document.body.classList.toggle("dark");
    localStorage.setItem("dark", isDark);
    btnDark.innerHTML = isDark ? '<i class="fas fa-sun"></i>' : '<i class="fas fa-moon"></i>';
  });
}

/* ===== TOAST ===== */
function mostrarToast(msg, tipo = "success") {
  const container = $("#toast-container");
  if (!container) return;

  const toast = document.createElement("div");
  const icone = tipo === "error" ? "exclamation-circle" : "check-circle";

  toast.className = `toast ${tipo}`;
  toast.innerHTML = `<i class="fas fa-${icone}"></i> ${msg}`;

  container.appendChild(toast);

  requestAnimationFrame(() => toast.classList.add("show"));

  setTimeout(() => {
    toast.classList.remove("show");
    setTimeout(() => toast.remove(), 300);
  }, 4000);
}

/* ===== MODAL ===== */
function confirmarAcao(mensagem, onConfirm) {
  const overlay = document.createElement("div");
  overlay.className = "modal-overlay";

  overlay.innerHTML = `
    <div class="modal">
      <i class="fas fa-question-circle"></i>
      <h3>Confirmação</h3>
      <p>${mensagem}</p>
      <div class="modal-actions">
        <button class="btn-cancel">Cancelar</button>
        <button class="btn-confirm">Confirmar</button>
      </div>
    </div>
  `;

  document.body.appendChild(overlay);

  const close = () => overlay.remove();

  overlay.querySelector(".btn-cancel").onclick = close;
  overlay.querySelector(".btn-confirm").onclick = () => {
    onConfirm();
    close();
  };

  overlay.onclick = (e) => {
    if (e.target === overlay) close();
  };
}

/* ===== CPF ===== */
function validarCPF(cpf) {
  cpf = cpf.replace(/\D/g, "");
  if (cpf.length !== 11 || /^(\d)\1+$/.test(cpf)) return false;

  let soma = 0, resto;

  for (let i = 1; i <= 9; i++)
    soma += parseInt(cpf[i - 1]) * (11 - i);

  resto = (soma * 10) % 11;
  if (resto === 10 || resto === 11) resto = 0;
  if (resto !== parseInt(cpf[9])) return false;

  soma = 0;
  for (let i = 1; i <= 10; i++)
    soma += parseInt(cpf[i - 1]) * (12 - i);

  resto = (soma * 10) % 11;
  if (resto === 10 || resto === 11) resto = 0;

  return resto === parseInt(cpf[10]);
}

/* ===== NAVEGAÇÃO ===== */
window.navegar = (id) => {
  $$(".section").forEach(s => s.classList.remove("active"));
  const tela = document.getElementById(id);
  if (tela) tela.classList.add("active");
  if (id === "tela-lista") renderizarTabela();
};

/* ===== CPF MASK ===== */
const cpfInput = $("#cpf");
if (cpfInput) {
  cpfInput.addEventListener("input", (e) => {
    let v = e.target.value.replace(/\D/g, "")
      .replace(/(\d{3})(\d)/, "$1.$2")
      .replace(/(\d{3})(\d)/, "$1.$2")
      .replace(/(\d{3})(\d{1,2})$/, "$1-$2");
    e.target.value = v;
  });
}

/* ===== CADASTRO ===== */
const form = $("#formCadastro");

if (form) {
  form.addEventListener("submit", (e) => {
    e.preventDefault();

    const usuario = {
      nome: $("#nome").value.trim(),
      email: $("#email").value.trim(),
      cpf: $("#cpf").value,
      idade: parseInt($("#idade").value)
    };

    if (usuario.idade <= 0 || usuario.idade > 120)
      return mostrarToast("Idade inválida!", "error");

    if (!validarCPF(usuario.cpf))
      return mostrarToast("CPF inválido!", "error");

    let usuarios = storage.get("usuarios");

    if (editIndex > -1) {
      usuarios[editIndex] = usuario;
      editIndex = -1;
      mostrarToast("Atualizado com sucesso!");
    } else {
      usuarios.push(usuario);
      mostrarToast("Salvo com sucesso!");
    }

    storage.set("usuarios", usuarios);
    form.reset();
  });
}

/* ===== TABELA ===== */
function renderizarTabela() {
  const usuarios = storage.get("usuarios");
  const tbody = $("#listaCorpo");
  const total = $("#totalUsuarios");

  if (!tbody) return;

  tbody.innerHTML = "";
  total.innerHTML = `<i class="fas fa-users"></i> ${usuarios.length}`;

  usuarios.forEach((u, i) => {
    const tr = document.createElement("tr");

    tr.innerHTML = `
      <td>${u.nome}</td>
      <td>${u.email}</td>
      <td>${u.cpf}</td>
      <td>${u.idade}</td>
      <td>
        <button onclick="editarUsuario(${i})">Editar</button>
        <button onclick="excluirUsuario(${i})">Excluir</button>
      </td>
    `;

    tbody.appendChild(tr);
  });
}

window.excluirUsuario = (i) => {
  confirmarAcao("Excluir usuário?", () => {
    let usuarios = storage.get("usuarios");
    usuarios.splice(i, 1);
    storage.set("usuarios", usuarios);
    renderizarTabela();
    mostrarToast("Removido!", "error");
  });
};

window.editarUsuario = (i) => {
  const u = storage.get("usuarios")[i];

  $("#nome").value = u.nome;
  $("#email").value = u.email;
  $("#cpf").value = u.cpf;
  $("#idade").value = u.idade;

  editIndex = i;
  navegar("tela-cadastro");
};

/* ===== LIMPAR ===== */
window.limparTodos = () => {
  confirmarAcao("Apagar tudo?", () => {
    localStorage.removeItem("usuarios");
    renderizarTabela();
    mostrarToast("Banco limpo!", "error");
  });
};

/* ===== CEP ===== */
window.buscarCep = async () => {
  const cep = $("#cep").value.replace(/\D/g, "");
  const status = $("#statusCep");

  if (cep.length !== 8)
    return mostrarToast("CEP inválido!", "error");

  status.innerHTML = "Buscando...";

  try {
    const res = await fetch(`https://viacep.com.br/ws/${cep}/json/`);
    const d = await res.json();

    if (d.erro) throw new Error();

    $("#rua").value = d.logradouro || "";
    $("#bairro").value = d.bairro || "";
    $("#cidade").value = d.localidade || "";
    $("#estado").value = d.uf || "";

    status.innerHTML = "OK";
    mostrarToast("Endereço carregado!");
  } catch {
    status.innerHTML = "Erro";
    mostrarToast("CEP não encontrado", "error");
  }
};

/* ===== INIT ===== */
if ($("#tela-lista")?.classList.contains("active")) {
  renderizarTabela();
}

});