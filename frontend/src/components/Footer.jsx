import { Container } from "react-bootstrap";

export default function Footer() {
  const currentYear = new Date().getFullYear();

  return (
    <footer
      className="mt-auto py-3 border-top"
      style={{
        backgroundColor: "var(--color-surface)",
        borderColor: "var(--color-border-subtle)",
      }}
    >
      <Container
        fluid
        className="px-3 px-lg-5 text-center"
        style={{ maxWidth: "1600px" }}
      >
        <p className="mb-0 small text-muted">
          &copy; {currentYear} Carpool. All rights reserved.
        </p>
      </Container>
    </footer>
  );
}