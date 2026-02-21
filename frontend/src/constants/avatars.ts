/**
 * Avatar emojis for user profiles (15-20, dinosaurs included!)
 */
export const AVATAR_OPTIONS = [
  '🦕', // sauropod
  '🦖', // T-Rex
  '🐱', // cat
  '🐶', // dog
  '🐼', // panda
  '🦊', // fox
  '🐸', // frog
  '🦉', // owl
  '🦋', // butterfly
  '🐢', // turtle
  '🐙', // octopus
  '🦈', // shark
  '🐲', // dragon
  '🦄', // unicorn
  '🚀', // rocket
  '⭐', // star
  '🌸', // flower
  '🎭', // theater
  '🐉', // dragon (Chinese)
  '🦎', // lizard
] as const;

export type Avatar = (typeof AVATAR_OPTIONS)[number];
