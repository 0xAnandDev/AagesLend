import { Link } from "react-router-dom";

export default function NotFound() {
  return (
    <div className="card mx-auto max-w-md text-center">
      <h1 className="text-3xl">Page not found</h1>
      <Link to="/dashboard" className="btn-primary mt-6">
        Go to dashboard
      </Link>
    </div>
  );
}
