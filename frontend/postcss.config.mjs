import aspectRatio from "@tailwindcss/aspect-ratio";

const config = {
  plugins: {
    "@tailwindcss/postcss": {
      plugins: [aspectRatio],
    },
  },
};

export default config;
