const canvas = document.getElementById("ruleta");
const ctx = canvas.getContext("2d");

let anguloActual = 0;
let girando = false;
let equipoTurno = "A";

const CATEGORIAS = [
  { key: "com", label: "Comunicación", color: "#4A90E2" },
  { key: "obj", label: "Objetivo Común", color: "#EF4B8B" },
  { key: "res", label: "Resolución", color: "#F6D44B" },
  { key: "col", label: "Colaboración", color: "#2ECC71" },
  { key: "corona", label: "Corona", color: "#F39C12" },
  { key: "respina", label: "Respina", color: "#8E44AD" }
];

function dibujarRuleta() {
  const porcion = (2 * Math.PI) / CATEGORIAS.length;
  CATEGORIAS.forEach((seg, i) => {
    ctx.beginPath();
    ctx.fillStyle = seg.color;
    ctx.moveTo(250, 250);
    ctx.arc(250, 250, 240, porcion * i + anguloActual, porcion * (i + 1) + anguloActual);
    ctx.fill();
  });
}

dibujarRuleta();

document.getElementById("btnGirar").addEventListener("click", girar);

function girar() {
  if (girando) return;
  girando = true;
  let giros = Math.random() * 2000 + 3000; 

  let giro = setInterval(() => {
    anguloActual += 0.25;
    dibujarRuleta();
  }, 10);

  setTimeout(() => {
    clearInterval(giro);
    girando = false;
    validarCategoria();
  }, giros);
}

function validarCategoria() {
  const porcion = (2 * Math.PI) / CATEGORIAS.length;
  let indexSeleccion =
    (Math.floor(((2 * Math.PI - (anguloActual % (2 * Math.PI))) % (2 * Math.PI)) / porcion)
    + CATEGORIAS.length) % CATEGORIAS.length;

  let categoria = CATEGORIAS[indexSeleccion].label;
  alert("Categoría: " + categoria);
}
