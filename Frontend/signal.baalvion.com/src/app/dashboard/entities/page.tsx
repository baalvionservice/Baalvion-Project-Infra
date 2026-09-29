import { Suspense } from "react";

import { EntitiesView } from "./entities-view";

export default function EntitiesPage() {
  return (
    <Suspense fallback={null}>
      <EntitiesView />
    </Suspense>
  );
}
