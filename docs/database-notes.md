# Database Notes

`public.project_modules` stores the modules that make up each project's workspace. Each row belongs to one project and represents one module in that project's layout.

Each project must have unique module order values. That means a single project should not have two modules with the same `"order"` number.

The unique index on `(project_id, "order")` enforces that rule in the database. It helps keep module positions consistent and prevents accidental duplicate ordering inside the same project.

Migration files stay in the repo even after the SQL has already been run because they are part of the project's history. They show how the database changed over time and help other environments apply the same changes in the same order.
