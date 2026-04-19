export default function Background3D() {
  return (
    <div className="fixed inset-0 z-0 pointer-events-none overflow-hidden">
      {/* Ambient gradient blobs */}
      <div
        className="absolute w-[600px] h-[600px] rounded-full opacity-20 blur-3xl"
        style={{
          background: 'radial-gradient(circle, hsl(262 83% 68%), transparent 70%)',
          top: '-10%',
          left: '-5%',
          animation: 'floatA 18s ease-in-out infinite',
        }}
      />
      <div
        className="absolute w-[500px] h-[500px] rounded-full opacity-15 blur-3xl"
        style={{
          background: 'radial-gradient(circle, hsl(198 85% 58%), transparent 70%)',
          bottom: '-10%',
          right: '-5%',
          animation: 'floatB 22s ease-in-out infinite',
        }}
      />
      <div
        className="absolute w-[400px] h-[400px] rounded-full opacity-10 blur-3xl"
        style={{
          background: 'radial-gradient(circle, hsl(330 70% 65%), transparent 70%)',
          top: '40%',
          right: '20%',
          animation: 'floatC 15s ease-in-out infinite',
        }}
      />
      <div
        className="absolute w-[300px] h-[300px] rounded-full opacity-10 blur-3xl"
        style={{
          background: 'radial-gradient(circle, hsl(150 60% 50%), transparent 70%)',
          bottom: '20%',
          left: '15%',
          animation: 'floatD 20s ease-in-out infinite',
        }}
      />

      {/* Grid overlay */}
      <div
        className="absolute inset-0 opacity-[0.03]"
        style={{
          backgroundImage: `
            linear-gradient(hsl(var(--foreground)) 1px, transparent 1px),
            linear-gradient(90deg, hsl(var(--foreground)) 1px, transparent 1px)
          `,
          backgroundSize: '48px 48px',
        }}
      />

      <style>{`
        @keyframes floatA {
          0%, 100% { transform: translate(0, 0) scale(1); }
          33% { transform: translate(40px, -30px) scale(1.05); }
          66% { transform: translate(-20px, 20px) scale(0.98); }
        }
        @keyframes floatB {
          0%, 100% { transform: translate(0, 0) scale(1); }
          40% { transform: translate(-50px, 30px) scale(1.08); }
          70% { transform: translate(25px, -15px) scale(0.97); }
        }
        @keyframes floatC {
          0%, 100% { transform: translate(0, 0) scale(1); }
          50% { transform: translate(30px, 40px) scale(1.06); }
        }
        @keyframes floatD {
          0%, 100% { transform: translate(0, 0) scale(1); }
          45% { transform: translate(-25px, -35px) scale(1.04); }
          80% { transform: translate(15px, 10px) scale(0.96); }
        }
      `}</style>
    </div>
  );
}
