import { useState } from "react";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Input } from "@/components/ui/input";
import {
  Popover,
  PopoverContent,
  PopoverTrigger,
} from "@/components/ui/popover";
import { useTagsStore } from "@/stores/tagsStore";
import { Plus } from "lucide-react";
import type { CakeTag } from "@/data/products";

interface TagSelectorProps {
  selectedTags: string[];
  onTagToggle: (tag: string) => void;
  label?: string;
}

export function TagSelector({
  selectedTags,
  onTagToggle,
  label = "Tags",
}: TagSelectorProps) {
  const [newTag, setNewTag] = useState("");
  const [isOpen, setIsOpen] = useState(false);
  const availableTags = useTagsStore((state) => state.tags);
  const addTag = useTagsStore((state) => state.addTag);

  const handleAddNewTag = () => {
    if (newTag.trim() && !availableTags.includes(newTag as CakeTag)) {
      addTag(newTag as CakeTag);
      onTagToggle(newTag);
      setNewTag("");
    }
  };

  const handleTagClick = (tag: string) => {
    onTagToggle(tag);
  };

  return (
    <div className="space-y-2">
      <label className="text-sm font-medium">{label}</label>
      <div className="space-y-3">
        {/* Selected Tags Display */}
        <div className="flex flex-wrap gap-2 min-h-8">
          {selectedTags.length === 0 ? (
            <span className="text-sm text-muted-foreground">
              No tags selected
            </span>
          ) : (
            selectedTags.map((tag) => (
              <Badge
                key={tag}
                variant="default"
                className="cursor-pointer gap-1"
                onClick={() => handleTagClick(tag)}
              >
                {tag}
                <span className="ml-1">×</span>
              </Badge>
            ))
          )}
        </div>

        {/* Add Tag Popover */}
        <Popover open={isOpen} onOpenChange={setIsOpen}>
          <PopoverTrigger asChild>
            <Button type="button" variant="outline" size="sm" className="gap-2">
              <Plus className="w-4 h-4" />
              Add Tag
            </Button>
          </PopoverTrigger>
          <PopoverContent className="w-64 p-3">
            <div className="space-y-3">
              <p className="text-sm font-medium">Available Tags</p>

              {/* Available Tags */}
              <div className="flex flex-wrap gap-2">
                {availableTags.map((tag) => (
                  <Badge
                    key={tag}
                    variant={selectedTags.includes(tag) ? "default" : "outline"}
                    className="cursor-pointer"
                    onClick={() => handleTagClick(tag)}
                  >
                    {tag}
                  </Badge>
                ))}
              </div>

              {/* Add New Tag */}
              <div className="border-t pt-3 space-y-2">
                <p className="text-xs font-medium text-muted-foreground">
                  Create New Tag
                </p>
                <div className="flex gap-2">
                  <Input
                    placeholder="Tag name..."
                    value={newTag}
                    onChange={(e) => setNewTag(e.target.value)}
                    onKeyPress={(e) => {
                      if (e.key === "Enter") {
                        e.preventDefault();
                        handleAddNewTag();
                      }
                    }}
                    className="h-8"
                  />
                  <Button
                    type="button"
                    size="sm"
                    onClick={handleAddNewTag}
                    disabled={!newTag.trim()}
                  >
                    <Plus className="w-3 h-3" />
                  </Button>
                </div>
              </div>
            </div>
          </PopoverContent>
        </Popover>
      </div>
    </div>
  );
}
