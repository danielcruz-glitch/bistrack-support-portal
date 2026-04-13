'use client';

import { useMemo, useState } from 'react';

export function NewTicketForm({
  action,
  departments,
  categories,
  defaultDepartmentId
}: {
  action: (formData: FormData) => void;
  departments: { id: string; name: string }[];
  categories: { id: string; name: string }[];
  defaultDepartmentId: string;
}) {
  const [selectedCategory, setSelectedCategory] = useState('');
  const otherCategoryId = useMemo(
    () => categories.find((c) => c.name.toLowerCase() === 'other')?.id,
    [categories]
  );

  return (
    <form action={action} className="card mt-6 space-y-5">
      <div>
        <label htmlFor="title">Issue title</label>
        <input id="title" name="title" placeholder="Example: Credit card batch failed at close" required />
      </div>

      <div className="grid gap-4 md:grid-cols-2">
        <div>
          <label htmlFor="departmentId">Department</label>
          <select id="departmentId" name="departmentId" defaultValue={defaultDepartmentId} required>
            <option value="" disabled>Select department</option>
            {departments.map((department) => (
              <option key={department.id} value={department.id}>{department.name}</option>
            ))}
          </select>
        </div>
        <div>
          <label htmlFor="categoryId">Issue type</label>
          <select
            id="categoryId"
            name="categoryId"
            required
            defaultValue=""
            onChange={(e) => setSelectedCategory(e.target.value)}
          >
            <option value="" disabled>Select issue type</option>
            {categories.map((category) => (
              <option key={category.id} value={category.id}>{category.name}</option>
            ))}
          </select>
        </div>
      </div>

      {selectedCategory === otherCategoryId && (
        <div>
          <label htmlFor="otherIssueText">Other issue details</label>
          <input id="otherIssueText" name="otherIssueText" placeholder="Enter the custom issue type" required />
        </div>
      )}

      <div className="grid gap-4 md:grid-cols-2">
        <div>
          <label htmlFor="priority">Importance</label>
          <select id="priority" name="priority" defaultValue="Medium">
            <option>Low</option>
            <option>Medium</option>
            <option>High</option>
            <option>Critical</option>
          </select>
        </div>
        <div>
          <label htmlFor="urgency">Urgency</label>
          <select id="urgency" name="urgency" defaultValue="Medium">
            <option>Low</option>
            <option>Medium</option>
            <option>High</option>
            <option>Urgent</option>
          </select>
        </div>
      </div>

      <div>
        <label htmlFor="issueDescription">Issue description</label>
        <textarea
          id="issueDescription"
          name="issueDescription"
          rows={7}
          placeholder="Describe what happened, any error message, what screen you were on, and what you already tried."
          required
        />
      </div>

      <button className="rounded-xl bg-brand px-4 py-2.5 font-semibold text-white hover:bg-brand-dark">
        Submit ticket
      </button>
    </form>
  );
}
