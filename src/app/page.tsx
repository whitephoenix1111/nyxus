'use client';

import { useEffect, useState } from 'react';
import { useOpportunityStore } from '@/store/useOpportunityStore';
import { useActivityStore } from '@/store/useActivityStore';
import { useTaskStore } from '@/store/useTaskStore';
import { useIsManager, useCurrentUser } from '@/store/useAuthStore';
import { useUsersStore } from '@/store/useUsersStore';
import { ManagerDashboard } from '@/components/dashboard/ManagerDashboard';
import { SalesDashboard } from '@/components/dashboard/SalesDashboard';

export default function DashboardPage() {
  const { opportunities, fetchOpportunities, isLoading } = useOpportunityStore();
  const { activities, fetchActivities } = useActivityStore();
  const { tasks, fetchTasks, toggleDone } = useTaskStore();
  const isManager   = useIsManager();
  const currentUser = useCurrentUser();
  const { fetchUsers } = useUsersStore();

  const [ownerFilter, setOwnerFilter] = useState('');

  useEffect(() => {
    fetchOpportunities();
    fetchActivities();
    fetchTasks();
    if (isManager) fetchUsers();
  }, [fetchOpportunities, fetchActivities, fetchTasks, fetchUsers, isManager]);

  if (isLoading) {
    return (
      <div className="flex h-[60vh] items-center justify-center">
        <div className="text-center">
          <div className="mx-auto mb-3 h-8 w-8 animate-spin rounded-full border-2 border-[#1a1a1a] border-t-[#DFFF00]" />
          <p className="text-sm text-[#555]">Đang tải dữ liệu...</p>
        </div>
      </div>
    );
  }

  if (isManager) {
    return (
      <ManagerDashboard
        opportunities={opportunities}
        activities={activities}
        tasks={tasks}
        ownerFilter={ownerFilter}
        onOwnerFilterChange={setOwnerFilter}
      />
    );
  }

  return (
    <SalesDashboard
      opportunities={opportunities}
      activities={activities}
      tasks={tasks}
      currentUserId={currentUser?.id ?? ''}
      onToggleTask={toggleDone}
    />
  );
}
