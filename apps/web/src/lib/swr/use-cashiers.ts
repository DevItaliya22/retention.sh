"use client";

import useSWR from "swr";
import useSWRMutation from "swr/mutation";
import { fetcher } from "../fetcher";

export interface Cashier {
  id: string;
  name: string;
  email: string;
  linkSlug: string;
  createdAt: string;
  updatedAt: string;
}

interface CashiersResponse {
  cashiers: Cashier[];
}

interface CreateCashierPayload {
  cashierName: string;
  cashierEmail: string;
  cashierLinkSlug: string;
  cashierPassword: string;
}

interface UpdateCashierPayload {
  cashierName?: string;
  cashierEmail?: string;
  cashierLinkSlug?: string;
}

const CASHIERS_KEY = "/api/cashiers";

async function createCashier(
  url: string,
  { arg }: { arg: CreateCashierPayload },
) {
  return fetcher<{ cashier: Cashier }>(url, {
    method: "POST",
    body: JSON.stringify(arg),
  });
}

async function updateCashier(
  url: string,
  { arg }: { arg: { id: string; data: UpdateCashierPayload } },
) {
  return fetcher<{ cashier: Cashier }>(`${url}/${arg.id}`, {
    method: "PUT",
    body: JSON.stringify(arg.data),
  });
}

async function deleteCashier(url: string, { arg }: { arg: { id: string } }) {
  return fetcher<{ success: boolean }>(`${url}/${arg.id}`, {
    method: "DELETE",
  });
}

export function useCashiers() {
  const { data, error, isLoading, mutate } = useSWR<CashiersResponse>(
    CASHIERS_KEY,
    fetcher,
    {
      revalidateOnFocus: false,
      revalidateOnReconnect: true,
    },
  );

  const { trigger: create, isMutating: isCreating } = useSWRMutation(
    CASHIERS_KEY,
    createCashier,
  );

  const { trigger: update, isMutating: isUpdating } = useSWRMutation(
    CASHIERS_KEY,
    updateCashier,
  );

  const { trigger: remove, isMutating: isDeleting } = useSWRMutation(
    CASHIERS_KEY,
    deleteCashier,
  );

  const handleCreate = async (payload: CreateCashierPayload) => {
    const result = await create(payload);
    await mutate();
    return result;
  };

  const handleUpdate = async (id: string, payload: UpdateCashierPayload) => {
    const result = await update({ id, data: payload });
    await mutate();
    return result;
  };

  const handleDelete = async (id: string) => {
    const result = await remove({ id });
    await mutate();
    return result;
  };

  return {
    cashiers: data?.cashiers ?? [],
    isLoading,
    error,
    create: handleCreate,
    update: handleUpdate,
    delete: handleDelete,
    isCreating,
    isUpdating,
    isDeleting,
    mutate,
  };
}
