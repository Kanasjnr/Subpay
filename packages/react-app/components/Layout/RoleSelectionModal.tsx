import { Dialog, DialogContent, DialogHeader, DialogTitle } from "@/components/ui/dialog"
import { Button } from "@/components/ui/button"
import { useRouter, usePathname } from "next/navigation"
import { motion } from "framer-motion"

interface RoleSelectionModalProps {
  isOpen: boolean
  onClose: () => void
}

export function RoleSelectionModal({ isOpen, onClose }: RoleSelectionModalProps) {
  const router = useRouter()
  const pathname = usePathname()

  const handleRoleSelect = (role: 'subscriber' | 'business') => {
    // Only navigate if we're not already on the role's page
    if (pathname !== `/${role}`) {
      router.push(`/${role}`)
    }
    onClose()
  }

  return (
    <Dialog open={isOpen} onOpenChange={onClose}>
      <DialogContent className="sm:max-w-md">
        <DialogHeader>
          <DialogTitle>Choose Your Role</DialogTitle>
        </DialogHeader>
        <div className="grid gap-4 py-4">
          <motion.div
            whileHover={{ scale: 1.02 }}
            whileTap={{ scale: 0.98 }}
          >
            <Button
              variant="outline"
              className="w-full h-24 flex flex-col items-center justify-center gap-2"
              onClick={() => handleRoleSelect('subscriber')}
            >
              <span className="text-xl font-semibold">Subscriber</span>
              <span className="text-sm text-gray-500">Manage your subscriptions and make payments</span>
            </Button>
          </motion.div>
          <motion.div
            whileHover={{ scale: 1.02 }}
            whileTap={{ scale: 0.98 }}
          >
            <Button
              variant="outline"
              className="w-full h-24 flex flex-col items-center justify-center gap-2"
              onClick={() => handleRoleSelect('business')}
            >
              <span className="text-xl font-semibold">Service Provider</span>
              <span className="text-sm text-gray-500">Create and manage subscription plans</span>
            </Button>
          </motion.div>
        </div>
      </DialogContent>
    </Dialog>
  )
} 