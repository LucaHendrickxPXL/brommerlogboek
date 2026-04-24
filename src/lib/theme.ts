import { Badge, Button, Card, createTheme, Paper } from "@mantine/core";

export const appTheme = createTheme({
  primaryColor: "teal",
  defaultRadius: "xl",
  fontFamily: "var(--font-body)",
  headings: {
    fontFamily: "var(--font-heading)",
    fontWeight: "700",
  },
  colors: {
    teal: [
      "#ebf8f6",
      "#d9f0ec",
      "#b2dfd7",
      "#87cec1",
      "#61bdaa",
      "#43ab95",
      "#2f8d79",
      "#236d5f",
      "#194f45",
      "#0d322c",
    ],
    amber: [
      "#fff7eb",
      "#ffeed3",
      "#ffdb9f",
      "#ffc568",
      "#ffb343",
      "#ffa221",
      "#dd8510",
      "#ad670a",
      "#7d4a05",
      "#4f2d00",
    ],
    rose: [
      "#fff0ef",
      "#ffe1de",
      "#ffc2bb",
      "#ff9e92",
      "#ff7c6a",
      "#ff6450",
      "#d94735",
      "#a83426",
      "#742219",
      "#42100b",
    ],
  },
  components: {
    Button: Button.extend({
      defaultProps: {
        radius: "xl",
      },
    }),
    Badge: Badge.extend({
      defaultProps: {
        radius: "xl",
      },
    }),
    Card: Card.extend({
      defaultProps: {
        radius: "xl",
        padding: "lg",
      },
    }),
    Paper: Paper.extend({
      defaultProps: {
        radius: "xl",
        p: "lg",
      },
    }),
  },
});
