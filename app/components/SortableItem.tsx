import {
  KeyboardSensor,
  MouseSensor,
  TouchSensor,
  useSensor,
  useSensors,
} from "@dnd-kit/core";
import { useSortable } from "@dnd-kit/sortable";
import { CSS } from "@dnd-kit/utilities";
import type { CSSProperties, ElementType, ReactNode } from "react";
import { cn } from "@/lib/utils";

type SortableState = { isDragging: boolean; isOver: boolean };

/**
 * Pointer + touch + keyboard sensors tuned so the same drag-to-reorder works
 * with a mouse and on touch screens (tablets/phones):
 * - Mouse: an 8px move starts the drag, so plain clicks still reach buttons.
 * - Touch: a 200ms long-press starts the drag, leaving quick swipes free to
 *   scroll the list. `tolerance` cancels the press if the finger moves first.
 * - Keyboard: space/arrows to reorder for accessibility.
 */
export function useDragSensors() {
  return useSensors(
    useSensor(MouseSensor, { activationConstraint: { distance: 8 } }),
    useSensor(TouchSensor, {
      activationConstraint: { delay: 200, tolerance: 8 },
    }),
    useSensor(KeyboardSensor),
  );
}

interface SortableItemProps {
  /** Must be a stable, unique id present in the parent SortableContext. */
  id: string;
  /** Rendered element/tag. Defaults to "div"; pass "li" inside a <ul>. */
  as?: ElementType;
  /** Static class, or a function of the live drag state. */
  className?: string | ((state: SortableState) => string);
  /** Static node, or a render function of the live drag state. */
  children: ReactNode | ((state: SortableState) => ReactNode);
}

/**
 * A single draggable/sortable item. Spreads the dnd-kit listeners over the
 * whole element (drag from anywhere) and exposes `isDragging`/`isOver` so the
 * caller can style the active and hovered states.
 */
export function SortableItem({ id, as, className, children }: SortableItemProps) {
  const {
    attributes,
    listeners,
    setNodeRef,
    transform,
    transition,
    isDragging,
    isOver,
  } = useSortable({ id });

  const state: SortableState = { isDragging, isOver };
  const style: CSSProperties = {
    transform: CSS.Transform.toString(transform),
    transition,
    // Keep the active item above its siblings while it animates into place.
    zIndex: isDragging ? 10 : undefined,
  };

  const Tag = (as ?? "div") as ElementType;
  const resolvedClassName =
    typeof className === "function" ? className(state) : className;
  const content = typeof children === "function" ? children(state) : children;

  return (
    <Tag
      ref={setNodeRef}
      style={style}
      className={cn("cursor-grab active:cursor-grabbing", resolvedClassName)}
      {...attributes}
      {...listeners}
      // dnd-kit drives the drag through pointer/touch events; block the
      // browser's native HTML5 image/text drag so it can't ghost-drag on
      // desktop before our pointer threshold activates.
      onDragStart={(e) => e.preventDefault()}
    >
      {content}
    </Tag>
  );
}
