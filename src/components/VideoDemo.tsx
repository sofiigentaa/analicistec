/** Video "Cómo se usa", grabado automáticamente con scripts/demo/grabar-demo.mjs. */
export default function VideoDemo() {
  return (
    <section id="video" aria-labelledby="video-titulo" className="card flex scroll-mt-4 flex-col overflow-hidden">
      <video controls preload="none" playsInline poster="/demo/portada.jpg" className="aspect-video w-full bg-ink">
        <source src="/demo/demo.mp4" type="video/mp4" />
        <track kind="captions" src="/demo/demo.vtt" srcLang="es" label="Español" default />
        Tu navegador no puede mostrar el video. <a href="/demo/demo.mp4">Descargalo acá</a>.
      </video>
      <div className="flex flex-col gap-1 p-4 sm:p-5">
        <h2 id="video-titulo" className="titulo text-xl text-ink">
          Mirá cómo se usa en 3 minutos
        </h2>
        <p className="text-ink-soft">Un recorrido por todo: revisar un mensaje, un link, un comprobante y un pedido de transferencia, qué hacer si caíste y Pandi. Tiene subtítulos.</p>
      </div>
    </section>
  );
}
