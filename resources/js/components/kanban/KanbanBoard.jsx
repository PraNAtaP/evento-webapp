import KanbanColumn from "./KanbanColumn";
import { KANBAN_COLUMNS } from "../../data/kanbanData";

export default function KanbanBoard({
    columns = KANBAN_COLUMNS,
    cards = [],
}) {
    return (
        <div className="w-full">
            {/* Horizontal Scrollable Area */}
            <div className="overflow-x-auto pb-6 scroll-smooth">
                <div className="flex gap-5 items-start min-w-max">
                    {columns.map((column) => {
                        const columnCards = cards.filter(
                            (card) => card.status === column.id
                        );

                        return (
                            <KanbanColumn
                                key={column.id}
                                column={column}
                                cards={columnCards}
                            />
                        );
                    })}
                </div>
            </div>
        </div>
    );
}
