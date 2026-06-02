'use client';

import { useForm } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';

import { Button, Input } from '@/components/ui';

import { createUserSchema, type CreateUserInput } from '../validation';
import { useCreateUser } from '../hooks';

/** Invite a back-office user (email + name + role + password). */
export function CreateUserForm({ onCreated }: { onCreated?: () => void }) {
  const createUser = useCreateUser();
  const {
    register,
    handleSubmit,
    reset,
    formState: { errors, isSubmitting },
  } = useForm<CreateUserInput>({
    resolver: zodResolver(createUserSchema),
    defaultValues: { email: '', name: '', password: '', role: 'TENANT_STAFF' },
  });

  const onSubmit = handleSubmit(async (values) => {
    await createUser.mutateAsync(values);
    reset();
    onCreated?.();
  });

  return (
    <form onSubmit={onSubmit} className="grid gap-3 sm:grid-cols-2 lg:grid-cols-4">
      <div className="space-y-1">
        <Input placeholder="Email" type="email" {...register('email')} />
        {errors.email && <p className="text-destructive text-xs">{errors.email.message}</p>}
      </div>
      <div className="space-y-1">
        <Input placeholder="Name" {...register('name')} />
      </div>
      <div className="space-y-1">
        <select
          className="border-input h-9 w-full rounded-md border bg-transparent px-3 text-sm"
          {...register('role')}
        >
          <option value="TENANT_STAFF">Staff</option>
          <option value="TENANT_ADMIN">Tenant Admin</option>
          <option value="SUPER_ADMIN">Super Admin</option>
        </select>
      </div>
      <div className="flex gap-2">
        <Input placeholder="Password" type="password" {...register('password')} />
        <Button type="submit" disabled={isSubmitting || createUser.isPending}>
          {createUser.isPending ? '…' : 'Add'}
        </Button>
      </div>
      {errors.password && (
        <p className="text-destructive text-xs sm:col-span-2 lg:col-span-4">
          {errors.password.message}
        </p>
      )}
    </form>
  );
}
