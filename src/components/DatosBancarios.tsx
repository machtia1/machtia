'use client';

import { useEffect, useState } from 'react';
import Link from 'next/link';
import { Landmark, Wallet, ShieldCheck, Trash2 } from 'lucide-react';
import LoadingLogo from './LoadingLogo';
import { LISTA_BANCOS_MEXICO, MONEDAS_WALLET, REDES_WALLET, OTRO_BANCO, bancoDeClabe } from '@/lib/datosBancarios';

interface VistaBanco {
  tipo: 'MEXICO' | 'INTERNACIONAL';
  banco: string;
  titular: string;
  pais: string;
  adicionales: string;
  cuentaEnmascarada: string;
}
interface VistaWallet {
  moneda: 'USDC' | 'USDT';
  red: string;
  adicionales: string;
  direccionEnmascarada: string;
}

const campo = 'w-full h-10 px-3 rounded-xl border border-[#E4E7EE] bg-white text-[13px] outline-none focus:border-cm-primary';
const etiqueta = 'block text-[12px] font-semibold text-[#374151] mb-1';

/**
 * Datos para recibir pagos (cuenta bancaria y/o wallet). Disponible para
 * todos los usuarios. Se guardan cifrados; aquí solo se ven enmascarados
 * y únicamente el Administrador puede consultarlos completos.
 */
export default function DatosBancarios({ conVolver = false }: { conVolver?: boolean }) {
  const [cargando, setCargando] = useState(true);
  const [errorCarga, setErrorCarga] = useState('');
  const [banco, setBanco] = useState<VistaBanco | null>(null);
  const [wallet, setWallet] = useState<VistaWallet | null>(null);

  // formulario banco
  const [usarBanco, setUsarBanco] = useState(false);
  const [tipo, setTipo] = useState<'MEXICO' | 'INTERNACIONAL'>('MEXICO');
  const [nombreBanco, setNombreBanco] = useState('');
  const [cuenta, setCuenta] = useState('');
  const [titular, setTitular] = useState('');
  const [pais, setPais] = useState('');
  const [adicBanco, setAdicBanco] = useState('');
  // formulario wallet
  const [usarWallet, setUsarWallet] = useState(false);
  const [moneda, setMoneda] = useState<'USDC' | 'USDT'>('USDT');
  const [red, setRed] = useState('TRC-20');
  const [direccion, setDireccion] = useState('');
  const [adicWallet, setAdicWallet] = useState('');

  const [guardando, setGuardando] = useState(false);
  const [error, setError] = useState('');
  const [aviso, setAviso] = useState('');

  const aplicar = (b: VistaBanco | null, w: VistaWallet | null) => {
    setBanco(b);
    setWallet(w);
    setUsarBanco(!!b);
    setUsarWallet(!!w);
    if (b) {
      setTipo(b.tipo);
      setNombreBanco(b.banco);
      setTitular(b.titular);
      setPais(b.pais);
      setAdicBanco(b.adicionales);
    }
    if (w) {
      setMoneda(w.moneda);
      setRed(w.red);
      setAdicWallet(w.adicionales);
    }
    setCuenta('');
    setDireccion('');
  };

  useEffect(() => {
    fetch('/api/datos-bancarios')
      .then(async (res) => {
        const data = await res.json();
        if (!res.ok) throw new Error(data.error || 'No se pudo cargar');
        aplicar(data.banco, data.wallet);
      })
      .catch((e) => setErrorCarga(e.message || 'No se pudo cargar'))
      .finally(() => setCargando(false));
  }, []);

  // Si la CLABE ya identifica al banco, lo sugerimos solo.
  const alEscribirClabe = (v: string) => {
    const limpia = v.replace(/[^\d]/g, '').slice(0, 18);
    setCuenta(limpia);
    if (limpia.length >= 3) {
      const b = bancoDeClabe(limpia);
      if (b) setNombreBanco(b);
    }
  };

  const guardar = async () => {
    setError('');
    setAviso('');
    setGuardando(true);
    try {
      const cuerpo = {
        banco: usarBanco
          ? { tipo, banco: nombreBanco, cuenta, titular, pais: tipo === 'INTERNACIONAL' ? pais : undefined, adicionales: adicBanco }
          : null,
        wallet: usarWallet ? { moneda, red, direccion, adicionales: adicWallet } : null,
      };
      const res = await fetch('/api/datos-bancarios', {
        method: 'PUT',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(cuerpo),
      });
      const data = await res.json();
      if (!res.ok) {
        setError(data.error || 'No se pudieron guardar sus datos');
        return;
      }
      aplicar(data.banco, data.wallet);
      setAviso('Sus datos se guardaron correctamente.');
    } catch {
      setError('No se pudieron guardar sus datos. Revise su conexión e intente de nuevo.');
    } finally {
      setGuardando(false);
    }
  };

  if (cargando) return <LoadingLogo size={28} label="Cargando..." />;
  if (errorCarga) return <p role="alert" className="p-6 text-[13px] text-red-600">{errorCarga}</p>;

  const hayCuentaGuardada = !!banco && banco.tipo === tipo;
  const hayWalletGuardada = !!wallet && wallet.red === red;

  return (
    <div className="p-6 sm:p-8 max-w-[720px] mx-auto">
      {conVolver && (
        <Link href="/home" className="text-[13px] text-cm-primary font-semibold mb-3 inline-block">
          ← Volver a inicio
        </Link>
      )}
      <h1 className="text-[20px] font-bold mb-1">Datos bancarios</h1>
      <p className="text-[13px] text-[#6B7280] mb-3">
        Capture los datos donde desea recibir sus pagos. Puede registrar una cuenta bancaria, una wallet, o ambas.
      </p>
      <p className="flex items-start gap-2 text-[12px] text-[#166534] bg-[#E7F8EF] rounded-xl p-3 mb-5">
        <ShieldCheck size={15} className="shrink-0 mt-0.5" />
        <span>Sus datos se almacenan cifrados y solo el Administrador de Club Machtia puede consultarlos para realizarle pagos.</span>
      </p>

      {/* Cuenta bancaria */}
      <section className="bg-white border border-[#E4E7EE] rounded-2xl p-5 mb-4" data-testid="seccion-banco">
        <label className="flex items-center gap-2 text-[14px] font-semibold cursor-pointer mb-1">
          <input type="checkbox" checked={usarBanco} onChange={(e) => setUsarBanco(e.target.checked)} />
          <Landmark size={16} className="text-cm-accent" /> Cuenta bancaria
        </label>
        {usarBanco && (
          <div className="flex flex-col gap-3 mt-3">
            <div className="flex gap-2">
              {(['MEXICO', 'INTERNACIONAL'] as const).map((t) => (
                <button
                  key={t}
                  type="button"
                  onClick={() => { setTipo(t); setNombreBanco(''); setCuenta(''); }}
                  className={`h-9 px-4 rounded-full text-[12.5px] font-semibold border ${
                    tipo === t ? 'bg-cm-primary text-white border-cm-primary' : 'bg-white border-[#E4E7EE]'
                  }`}
                >
                  {t === 'MEXICO' ? 'Cuenta en México' : 'Otro país'}
                </button>
              ))}
            </div>

            {tipo === 'MEXICO' ? (
              <>
                <div>
                  <label className={etiqueta} htmlFor="clabe">CLABE interbancaria (18 dígitos)</label>
                  <input id="clabe" inputMode="numeric" autoComplete="off" className={campo} value={cuenta} onChange={(e) => alEscribirClabe(e.target.value)}
                    placeholder={hayCuentaGuardada ? `${banco!.cuentaEnmascarada} — déjela vacía para conservarla` : '000000000000000000'} />
                </div>
                <div>
                  <label className={etiqueta} htmlFor="banco-mx">Banco</label>
                  <select id="banco-mx" className={campo} value={nombreBanco} onChange={(e) => setNombreBanco(e.target.value)}>
                    <option value="">Seleccione...</option>
                    {LISTA_BANCOS_MEXICO.map((b) => <option key={b} value={b}>{b}</option>)}
                  </select>
                  {nombreBanco === OTRO_BANCO && <p className="text-[11px] text-[#6B7280] mt-1">Si la CLABE es de un banco conocido, se completará automáticamente.</p>}
                </div>
              </>
            ) : (
              <>
                <div>
                  <label className={etiqueta} htmlFor="cuenta-int">Número de cuenta o IBAN</label>
                  <input id="cuenta-int" autoComplete="off" className={campo} value={cuenta} onChange={(e) => setCuenta(e.target.value)}
                    placeholder={hayCuentaGuardada ? `${banco!.cuentaEnmascarada} — déjelo vacío para conservarlo` : ''} />
                </div>
                <div className="grid sm:grid-cols-2 gap-3">
                  <div>
                    <label className={etiqueta} htmlFor="banco-int">Banco</label>
                    <input id="banco-int" className={campo} value={nombreBanco} onChange={(e) => setNombreBanco(e.target.value)} maxLength={80} />
                  </div>
                  <div>
                    <label className={etiqueta} htmlFor="pais-int">País del banco</label>
                    <input id="pais-int" className={campo} value={pais} onChange={(e) => setPais(e.target.value)} maxLength={60} />
                  </div>
                </div>
              </>
            )}
            <div>
              <label className={etiqueta} htmlFor="titular">Nombre del beneficiario (titular de la cuenta)</label>
              <input id="titular" className={campo} value={titular} onChange={(e) => setTitular(e.target.value)} maxLength={120} />
            </div>
            {tipo === 'INTERNACIONAL' && (
              <div>
                <label className={etiqueta} htmlFor="adic-banco">Datos adicionales (opcional: SWIFT/BIC, sucursal…)</label>
                <input id="adic-banco" className={campo} value={adicBanco} onChange={(e) => setAdicBanco(e.target.value)} maxLength={200} />
              </div>
            )}
          </div>
        )}
      </section>

      {/* Wallet */}
      <section className="bg-white border border-[#E4E7EE] rounded-2xl p-5 mb-4" data-testid="seccion-wallet">
        <label className="flex items-center gap-2 text-[14px] font-semibold cursor-pointer mb-1">
          <input type="checkbox" checked={usarWallet} onChange={(e) => setUsarWallet(e.target.checked)} />
          <Wallet size={16} className="text-cm-accent" /> Wallet (criptomonedas)
        </label>
        {usarWallet && (
          <div className="flex flex-col gap-3 mt-3">
            <div className="grid sm:grid-cols-2 gap-3">
              <div>
                <label className={etiqueta} htmlFor="moneda">Moneda</label>
                <select id="moneda" className={campo} value={moneda} onChange={(e) => setMoneda(e.target.value as 'USDC' | 'USDT')}>
                  {MONEDAS_WALLET.map((m) => <option key={m} value={m}>{m}</option>)}
                </select>
              </div>
              <div>
                <label className={etiqueta} htmlFor="red">Red</label>
                <select id="red" className={campo} value={red} onChange={(e) => { setRed(e.target.value); setDireccion(''); }}>
                  {REDES_WALLET.map((r) => <option key={r.valor} value={r.valor}>{r.etiqueta}</option>)}
                </select>
              </div>
            </div>
            <div>
              <label className={etiqueta} htmlFor="direccion">Dirección de la wallet</label>
              <input id="direccion" autoComplete="off" spellCheck={false} className={campo} value={direccion} onChange={(e) => setDireccion(e.target.value)}
                placeholder={hayWalletGuardada ? `${wallet!.direccionEnmascarada} — déjela vacía para conservarla` : ''} />
              <p className="text-[11px] text-[#B45309] mt-1">Verifique que la dirección sea de la red seleccionada: un envío por red equivocada puede perderse.</p>
            </div>
            <div>
              <label className={etiqueta} htmlFor="adic-wallet">Datos adicionales (opcional: memo, tag…)</label>
              <input id="adic-wallet" className={campo} value={adicWallet} onChange={(e) => setAdicWallet(e.target.value)} maxLength={200} />
            </div>
          </div>
        )}
      </section>

      {!usarBanco && !usarWallet && (banco || wallet) && (
        <p className="flex items-center gap-2 text-[12px] text-[#B45309] mb-3"><Trash2 size={13} /> Al guardar sin ninguna opción marcada, sus datos se eliminarán.</p>
      )}
      {error && <p role="alert" className="text-[13px] text-red-600 mb-3">{error}</p>}
      {aviso && <p role="status" className="text-[13px] text-[#16A34A] mb-3">{aviso}</p>}
      <button
        onClick={guardar}
        disabled={guardando}
        className="h-11 px-6 rounded-xl bg-cm-primary text-white text-[13.5px] font-semibold disabled:opacity-60"
      >
        {guardando ? 'Guardando...' : 'Guardar datos'}
      </button>
    </div>
  );
}
