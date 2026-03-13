# LLD — Zustand Stores

> File trước: `lld-data-api.md` · File tiếp theo: `lld-components.md`

---

## 1. useAuthStore

```typescript
// src/store/useAuthStore.ts
interface AuthStore {
  user: User | null;
  isLoading: boolean;
  fetchMe: () => Promise<void>;
  logout: () => Promise<void>;
}
```

**Selectors:**
```typescript
export function useCurrentUser(): User | null
export function useIsManager(): boolean
export function useIsSalesperson(): boolean
```

---

## 2. useUsersStore

```typescript
interface UsersStore {
  users: User[];
  fetchUsers: () => Promise<void>;
}
```

**Selectors:**
```typescript
export function useUserById(id: string): User | undefined
export function useSalespersons(): User[]
```

---

## 3. useClientStore

```typescript
interface ClientStore {
  clients: Client[];
  isLoading: boolean;
  fetchClients: () => Promise<void>;
  addLead: (data: LeadFormData) => Promise<{ client: Client; opportunity: Opportunity }>;
  addExistingClient: (data: ExistingClientFormData) => Promise<void>;
  updateClient: (id: string, data: Partial<Client>) => Promise<void>;
  deleteClient: (id: string) => Promise<void>;       // soft delete
  assignLead: (clientId: string, ownerId: string) => Promise<void>;
}
```

**Selectors:**
```typescript
// Join client với opportunities, tính stats
export function useClientsWithStats(opportunities: Opportunity[]): ClientWithStats[]

export function useClientIndustries(): string[]

export function useTopClientsByValue(opportunities: Opportunity[], limit: number): ClientWithStats[]
```

**Computed tags** (không lưu DB — tính khi render):
```typescript
function computeTags(client: Client, opportunities: Opportunity[]): ClientTag[] {
  const tags: ClientTag[] = [...client.tags]; // enterprise, mid-market
  const totalValue = opportunities.reduce((s, o) => s + o.value, 0);
  const lastContact = Math.max(...opportunities.map(o => new Date(o.lastContactDate).getTime()));
  const daysSinceContact = (Date.now() - lastContact) / 86400000;
  const daysSinceCreate = (Date.now() - new Date(client.createdAt).getTime()) / 86400000;

  if (daysSinceCreate < 7) tags.push('new-lead');
  if (daysSinceContact < 14) tags.push('warm');
  else if (daysSinceContact > 30 && !tags.includes('new-lead')) tags.push('cold');
  if (totalValue > 50000) tags.push('priority');
  return tags;
}
```

---

## 4. useOpportunityStore

```typescript
interface OpportunityStore {
  opportunities: Opportunity[];
  isLoading: boolean;
  fetchOpportunities: () => Promise<void>;
  updateOpportunity: (id: string, data: Partial<Opportunity>) => Promise<void>;
  updateStatus: (id: string, status: OpportunityStatus) => Promise<void>;
  deleteOpportunity: (id: string) => Promise<void>;
}
```

**Selectors:**

```typescript
// Count + totalValue mỗi status — dùng cho StatsBar
export function useStatsByStatus(): Record<OpportunityStatus, { count: number; totalValue: number }>

// Data điểm trên KPI ScatterChart
export function useMonthlyChartData(): Array<{
  month: number; value: number; status: OpportunityStatus; clientName: string; date: string;
}>

// Đường reference trên chart
export function useAverageValue(): number

// Weighted revenue = SUM(value × confidence/100) — dùng cho Forecast
export function useForecastRevenue(): number

// Top N opportunities by value — dùng cho TopClientsWidget
export function useTopClients(limit?: number): Opportunity[]

// Stale deals — lastContactDate > N ngày, status ∈ [Lead, Qualified, Proposal], không có pending task
export function useStaleLeads(activities: Activity[], days?: number): Opportunity[]

// Overdue tasks — nextActionDate đã qua, opportunity chưa có activity mới hơn
export function useOverdueTasks(activities: Activity[]): Array<{
  activity: Activity; opportunity: Opportunity;
}>

// Expiring proposals — Proposal + lastContactDate > 14 ngày
export function useExpiringProposals(days?: number): Opportunity[]

// Aggregate 3 loại reminder cho Dashboard Widget
export function useReminders(activities: Activity[]): ReminderAlert[]
```

**`useStaleLeads` — logic chi tiết:**
```typescript
export function useStaleLeads(activities: Activity[], days = 3) {
  const opps = useOpportunityStore(s => s.opportunities);
  return useMemo(() => {
    const now = Date.now();
    const threshold = days * 86400000;
    const staleStatuses: OpportunityStatus[] = ['Lead', 'Qualified', 'Proposal'];
    return opps.filter(opp => {
      if (!staleStatuses.includes(opp.status)) return false;
      if (now - new Date(opp.lastContactDate).getTime() <= threshold) return false;
      // Loại bỏ nếu có nextActionDate pending (task đã lên lịch)
      const hasPendingTask = activities.some(
        a => a.opportunityId === opp.id &&
          a.nextActionDate &&
          new Date(a.nextActionDate).getTime() >= now
      );
      return !hasPendingTask;
    });
  }, [opps, activities, days]);
}
```

**`useOverdueTasks` — logic chi tiết:**
```typescript
export function useOverdueTasks(activities: Activity[]) {
  const opps = useOpportunityStore(s => s.opportunities);
  return useMemo(() => {
    const now = Date.now();
    const results: Array<{ activity: Activity; opportunity: Opportunity }> = [];
    activities.forEach(act => {
      if (!act.nextActionDate) return;
      if (new Date(act.nextActionDate).getTime() >= now) return;
      if (!act.opportunityId) return;
      const opp = opps.find(o => o.id === act.opportunityId);
      if (!opp || opp.status === 'Won' || opp.status === 'Lost') return;
      // Đã xử lý nếu có activity mới hơn nextActionDate
      const handled = activities.some(
        a => a.opportunityId === opp.id &&
          a.id !== act.id &&
          new Date(a.date).getTime() > new Date(act.nextActionDate!).getTime()
      );
      if (!handled) results.push({ activity: act, opportunity: opp });
    });
    return results.sort(
      (a, b) => new Date(a.activity.nextActionDate!).getTime() -
                new Date(b.activity.nextActionDate!).getTime()
    );
  }, [opps, activities]);
}
```

---

## 5. useActivityStore

```typescript
interface ActivityStore {
  activities: Activity[];
  isLoading: boolean;
  fetchActivities: () => Promise<void>;
  addActivity: (data: ActivityFormData) => Promise<Activity>;
  updateActivity: (id: string, data: Partial<Activity>) => Promise<void>;
  deleteActivity: (id: string) => Promise<void>;
}
```

**Selectors:**
```typescript
export function useActivitiesByType(): Record<ActivityType, number>
export function useActivitiesByOutcome(): Record<ActivityOutcome, number>
export function useRecentActivities(limit?: number): Activity[]
export function useActivitiesForClient(clientId: string): Activity[]
```

---

## 6. useTaskStore

```typescript
interface TaskStore {
  tasks: Task[];
  isLoading: boolean;
  fetchTasks: () => Promise<void>;
  addTask: (data: TaskFormData) => Promise<void>;
  toggleDone: (id: string) => Promise<void>;
  deleteTask: (id: string) => Promise<void>;
}
```

**Selectors:**
```typescript
// Lọc tasks thuộc tập clients (dùng Set ownerClientIds)
export function useTasksForClients(clientIds: Set<string>): Task[]
```

---

## 7. useDocumentStore

```typescript
interface DocumentStore {
  documents: Document[];
  isLoading: boolean;
  fetchDocuments: () => Promise<void>;
  addDocument: (data: DocumentFormData) => Promise<void>;
  updateDocument: (id: string, data: Partial<Document>) => Promise<void>;
  deleteDocument: (id: string) => Promise<void>;
  toggleStar: (id: string) => Promise<void>;
}
```

**Selectors:**
```typescript
export function useDocumentsForClient(clientId: string): Document[]
```

---

## 8. useToastStore

```typescript
interface ToastStore {
  toasts: Toast[];
  push: (toast: Omit<Toast, 'id'>) => void;
  dismiss: (id: string) => void;
}

// Convenience helpers
export const toast = {
  success: (message: string) => void,
  error:   (message: string) => void,
  warning: (message: string) => void,
  info:    (message: string) => void,
};
```

Toast tự dismiss sau 4s. Render bởi `<ToastContainer />` ở bottom-right.
