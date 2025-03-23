import { SubscriptionList } from '@/components/subscription/SubscriptionList'
import { CreatePlanForm } from '@/components/subscription/CreatePlanForm'

export default function SubscriptionsPage() {
  return (
    <div className="container mx-auto py-8">
      <h1 className="text-3xl font-bold mb-8">Subscription Management</h1>
      
      <div className="grid gap-8">
        <section>
          <h2 className="text-2xl font-semibold mb-4">Create New Plan</h2>
          <CreatePlanForm />
        </section>

        <section>
          <h2 className="text-2xl font-semibold mb-4">Available Plans</h2>
          <SubscriptionList />
        </section>
      </div>
    </div>
  )
} 