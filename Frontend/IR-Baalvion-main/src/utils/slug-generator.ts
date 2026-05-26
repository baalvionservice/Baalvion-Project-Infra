export function slugify(text: string) {
  return text
    .toString()
    .normalize("NFD") // Split accents from characters
    .replace(/[\u0300-\u036f]/g, "") // Remove accents
    .toLowerCase()
    .trim()
    .replace(/\s+/g, "-") // Replace spaces with -
    .replace(/[^\w-]+/g, "") // Remove all non-word chars
    .replace(/--+/g, "-"); // Replace multiple - with single -
}
// Usage: slugify("Hello World! This is a Test.") -> "hello-world-this-is-a-test"
