import type { NombreIcono } from "../components/Iconos.tsx";

export interface PasoYaCai {
  titulo: string;
  detalle: string;
}

export interface CasoYaCai {
  id: string;
  titulo: string;
  descripcion: string;
  urgencia: string;
  icono: NombreIcono;
  pasos: PasoYaCai[];
}

export const CASOS_YA_CAI: CasoYaCai[] = [
  {
    id: "transferencia",
    titulo: "Transferí plata",
    descripcion: "Mandaste dinero a alguien que te engañó.",
    urgencia: "Actuá ya: cuanto antes avises al banco, más chances hay de frenar la plata.",
    icono: "banco",
    pasos: [
      {
        titulo: "Llamá a tu banco o billetera ahora",
        detalle: "Usá el teléfono de atención que está impreso atrás de tu tarjeta de débito o crédito, o el de la app oficial del banco. Nunca uno que te hayan pasado por mensaje. Contá que fue una estafa y pedí que intenten frenar o revertir la transferencia.",
      },
      {
        titulo: "Pedí que reporten la cuenta de destino",
        detalle: "Dales el alias o CBU/CVU al que mandaste, el monto y el horario exacto.",
      },
      {
        titulo: "Pedí un número de reclamo",
        detalle: "Anotá el número de reclamo, el nombre de quien te atendió y la hora de la llamada.",
      },
      {
        titulo: "Cambiá las claves de tu banco",
        detalle: "Hacelo desde otro dispositivo si creés que además accedieron a tu cuenta o a tu app.",
      },
      {
        titulo: "No pagues nada para «recuperar» la plata",
        detalle: "Si alguien te ofrece recuperarla a cambio de un adelanto, es una segunda estafa.",
      },
    ],
  },
  {
    id: "clave",
    titulo: "Di una clave o un código",
    descripcion: "Pasaste una contraseña, un código por SMS o el código de WhatsApp.",
    urgencia: "Cambiá las claves antes de que las usen.",
    icono: "candado",
    pasos: [
      {
        titulo: "Cambiá la clave de esa cuenta ya",
        detalle: "Desde otro dispositivo si podés. Si es la de tu banco o billetera, llamá también al banco.",
      },
      {
        titulo: "Activá la verificación en dos pasos",
        detalle: "Así, aunque tengan la clave, necesitan un segundo permiso que llega a tu celular.",
      },
      {
        titulo: "Cerrá las sesiones abiertas",
        detalle: "En la configuración de seguridad de la cuenta, elegí cerrar sesión en todos los dispositivos.",
      },
      {
        titulo: "Si fue el código de WhatsApp, recuperá tu cuenta",
        detalle: "Instalá WhatsApp de nuevo con tu número y poné el código nuevo. Activá la verificación en dos pasos y avisá a tus contactos que no atiendan pedidos de plata que lleguen de tu número.",
      },
      {
        titulo: "Cambiá esa clave en otros sitios",
        detalle: "Si usabas la misma en más lugares, cambiala en todos.",
      },
    ],
  },
  {
    id: "tarjeta",
    titulo: "Pasé los datos de mi tarjeta",
    descripcion: "Diste el número, el vencimiento o el código de seguridad.",
    urgencia: "Bloqueá la tarjeta antes de que hagan compras.",
    icono: "recibo",
    pasos: [
      {
        titulo: "Llamá al banco y bloqueá la tarjeta",
        detalle: "Pedí una tarjeta nueva. El teléfono figura en el dorso de la tarjeta.",
      },
      {
        titulo: "Pedí la revisión de los consumos",
        detalle: "Marcá los que no reconozcas y pedí que los desconozcan.",
      },
      {
        titulo: "Activá los avisos de consumo",
        detalle: "En la app del banco, así te llega una notificación por cada compra.",
      },
      {
        titulo: "Cambiá las claves del homebanking",
        detalle: "Si pasaste también claves o códigos, cambiá todo desde otro dispositivo.",
      },
    ],
  },
  {
    id: "datos",
    titulo: "Pasé mi DNI o datos personales",
    descripcion: "Mandaste fotos del DNI, tu CUIL o CUIT, o datos de tu identidad.",
    urgencia: "Con esos datos pueden intentar abrir cuentas o pedir créditos a tu nombre.",
    icono: "documento",
    pasos: [
      {
        titulo: "Cambiá las claves de tus cuentas importantes",
        detalle: "Correo, banco, billeteras y ARCA. Empezá por el correo.",
      },
      {
        titulo: "Activá la verificación en dos pasos",
        detalle: "Donde se pueda, sobre todo en el correo y en las billeteras virtuales.",
      },
      {
        titulo: "Revisá tu situación en ARCA y en el sistema financiero",
        detalle: "Entrá a ARCA con tu clave fiscal y mirá que no haya trámites que no hiciste. Consultá la Central de Deudores del Banco Central para ver si aparecen deudas que no reconocés.",
      },
      {
        titulo: "Avisá a tu banco",
        detalle: "Contales que expusiste tus datos para que estén atentos a movimientos raros.",
      },
      {
        titulo: "Hacé la denuncia por robo de identidad",
        detalle: "Te sirve como respaldo si después aparecen deudas o trámites que no hiciste.",
      },
    ],
  },
  {
    id: "app",
    titulo: "Instalé una app o di acceso remoto",
    descripcion: "Dejaste que alguien controle tu celular o tu compu (AnyDesk, TeamViewer u otra app).",
    urgencia: "Cortá la conexión primero.",
    icono: "alerta",
    pasos: [
      {
        titulo: "Desconectate de internet ya",
        detalle: "Apagá el wifi y los datos, o poné modo avión. Así cortás el acceso remoto.",
      },
      {
        titulo: "Desinstalá la app",
        detalle: "Borrá la que te hicieron instalar (AnyDesk, TeamViewer o cualquiera que no conozcas).",
      },
      {
        titulo: "Llamá a tu banco",
        detalle: "Contá lo que pasó: pueden haber visto tus claves o hecho operaciones. Pedí que revisen los movimientos.",
      },
      {
        titulo: "Cambiá todas las claves desde otro dispositivo",
        detalle: "Empezá por el correo y por el banco.",
      },
      {
        titulo: "Si sigue raro, restablecé el equipo",
        detalle: "Restaurar de fábrica borra lo que hayan instalado. Antes guardá tus fotos y archivos importantes.",
      },
    ],
  },
  {
    id: "extorsion",
    titulo: "Me amenazan o me extorsionan",
    descripcion: "Te piden plata o te amenazan con difundir fotos, videos o información.",
    urgencia: "No pagues: pagar suele traer más pedidos.",
    icono: "bandera",
    pasos: [
      {
        titulo: "No pagues y no respondas",
        detalle: "Quien amenaza una vez, suele volver a pedir.",
      },
      {
        titulo: "Bloqueá y denunciá la cuenta en la plataforma",
        detalle: "WhatsApp, Instagram y el resto tienen opciones para denunciar y bloquear a un usuario.",
      },
      {
        titulo: "Hablalo con alguien de confianza",
        detalle: "No es tu culpa y no tenés que pasarlo en silencio. El delito es de quien amenaza.",
      },
    ],
  },
];

/** Pasos que valen para todos los casos. */
export const PASOS_COMUNES: PasoYaCai[] = [
  {
    titulo: "Guardá las pruebas",
    detalle: "Capturas de pantalla de los mensajes, el número o usuario, los comprobantes y los horarios. No borres nada.",
  },
  {
    titulo: "Hacé la denuncia",
    detalle: "Andá a la fiscalía o comisaría de tu zona. En muchas provincias también se puede denunciar online. Llevá las pruebas.",
  },
  {
    titulo: "Avisá a tu familia y a tus contactos",
    detalle: "Si usaron tu cuenta o tu número, pueden escribirles a ellos para pedirles plata.",
  },
];

/** Texto plano de la guía, para copiar o mandar por WhatsApp. */
export function textoGuia(caso: CasoYaCai): string {
  const todos = [...caso.pasos, ...PASOS_COMUNES];
  return [
    `Guía: «${caso.titulo}»`,
    caso.urgencia,
    "",
    ...todos.map((p, i) => `${i + 1}. ${p.titulo}\n   ${p.detalle}`),
    "",
    "Armado con AntiEstafa AR. Ante la duda, llamá a tu banco al teléfono que está impreso atrás de tu tarjeta.",
  ].join("\n");
}