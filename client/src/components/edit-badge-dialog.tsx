
import { useState, useEffect } from "react";
import { useMutation, useQueryClient } from "@tanstack/react-query";
import { useToast } from "@/hooks/use-toast";
import { getAuthHeaders } from "@/lib/auth";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import {
    Dialog,
    DialogContent,
    DialogDescription,
    DialogHeader,
    DialogTitle,
    DialogFooter,
} from "@/components/ui/dialog";
import {
    Select,
    SelectContent,
    SelectItem,
    SelectTrigger,
    SelectValue,
} from "@/components/ui/select";

export function EditBadgeDialog({ badge, open, onOpenChange }: { badge: any, open: boolean, onOpenChange: (open: boolean) => void }) {
    const { toast } = useToast();
    const queryClient = useQueryClient();
    const [name, setName] = useState(badge.name);
    const [description, setDescription] = useState(badge.description);
    const [imageUrl, setImageUrl] = useState(badge.imageUrl || "");
    const [category, setCategory] = useState(badge.category);

    // Reset form when badge changes
    useEffect(() => {
        setName(badge.name);
        setDescription(badge.description);
        setImageUrl(badge.imageUrl || "");
        setCategory(badge.category);
    }, [badge]);

    const updateMutation = useMutation({
        mutationFn: async () => {
            const res = await fetch(`/api/admin/badges/${badge.id}`, {
                method: "PATCH",
                headers: {
                    ...getAuthHeaders(),
                    "Content-Type": "application/json",
                },
                body: JSON.stringify({ name, description, imageUrl, category }),
            });
            if (!res.ok) {
                const err = await res.json();
                throw new Error(err.error || "Failed to update badge");
            }
            return res.json();
        },
        onSuccess: () => {
            toast({ title: "Success", description: "Badge updated successfully" });
            onOpenChange(false);
            queryClient.invalidateQueries({ queryKey: ["/api/badges"] });
        },
        onError: (error: any) => {
            toast({ title: "Error", description: error.message, variant: "destructive" });
        },
    });

    return (
        <Dialog open={open} onOpenChange={onOpenChange}>
            <DialogContent>
                <DialogHeader>
                    <DialogTitle>Edit Badge</DialogTitle>
                    <DialogDescription>Update badge details</DialogDescription>
                </DialogHeader>
                <div className="space-y-4 py-4">
                    <div className="space-y-2">
                        <Label>Badge Name</Label>
                        <Input value={name} onChange={(e) => setName(e.target.value)} />
                    </div>
                    <div className="space-y-2">
                        <Label>Image URL (SVG/PNG)</Label>
                        <Input value={imageUrl} onChange={(e) => setImageUrl(e.target.value)} />
                    </div>
                    <div className="space-y-2">
                        <Label>Description</Label>
                        <Textarea value={description} onChange={(e) => setDescription(e.target.value)} />
                    </div>
                    <div className="space-y-2">
                        <Label>Category</Label>
                        <Select value={category} onValueChange={setCategory}>
                            <SelectTrigger>
                                <SelectValue placeholder="Select Category" />
                            </SelectTrigger>
                            <SelectContent>
                                <SelectItem value="general">General</SelectItem>
                                <SelectItem value="achievement">Achievement</SelectItem>
                                <SelectItem value="challenge">Challenge</SelectItem>
                            </SelectContent>
                        </Select>
                    </div>
                </div>
                <DialogFooter>
                    <Button variant="outline" onClick={() => onOpenChange(false)}>Cancel</Button>
                    <Button onClick={() => updateMutation.mutate()} disabled={updateMutation.isPending}>
                        {updateMutation.isPending ? "Saving..." : "Save Changes"}
                    </Button>
                </DialogFooter>
            </DialogContent>
        </Dialog>
    );
}
