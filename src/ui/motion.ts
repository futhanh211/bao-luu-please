// Animation constants and transition configurations
// All timing should be scaled according to app speed store (0.5x, 1x, 2x)

export const MOTION = {
  /** Vệt giấy chuyển màn: đủ chậm để mắt bắt kịp, không "vèo" một cái. */
  screenTransitionMs: 700,
  paperSlideMs: 450,
  stampDropMs: 120,
  stampShakeMs: 150,
  inkSpreadMs: 300,
  tokenStepMs: 750,
  splitTokenMs: 350,
  joinTokenMs: 200,
  envelopeFlyMs: 800,
  signatureDrawMs: 1200,
  typewriterCharMs: 30,
  aiTypewriterCharMs: 25,
  letterSlideMs: 350,
  scannerSweepMs: 1200,
};

export const screenVariants = {
  initial: { opacity: 0, y: 12 },
  animate: { opacity: 1, y: 0, transition: { duration: 0.55, ease: 'easeOut' } },
  exit: { opacity: 0, y: -12, transition: { duration: 0.4, ease: 'easeIn' } },
};
