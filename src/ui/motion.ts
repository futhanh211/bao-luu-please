// Animation constants and transition configurations
// All timing should be scaled according to app speed store (0.5x, 1x, 2x)

export const MOTION = {
  screenTransitionMs: 400,
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
};

export const screenVariants = {
  initial: { opacity: 0, y: 12 },
  animate: { opacity: 1, y: 0, transition: { duration: 0.4, ease: 'easeOut' } },
  exit: { opacity: 0, y: -12, transition: { duration: 0.3, ease: 'easeIn' } },
};
