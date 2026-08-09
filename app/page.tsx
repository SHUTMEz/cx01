"use client";

import { useEffect, useState } from "react";
import { useRouter } from "next/navigation";
import { motion, AnimatePresence } from "motion/react";
import { useStore } from "./store/useStore";
import { HugeiconsIcon } from "@hugeicons/react";
import {
  Edit01Icon,
  Delete01Icon,
  Cancel01Icon,
  Image02Icon,
  Search01Icon,
  Folder01Icon,
  TextSquareIcon,
  PlusSignIcon,
  MinusSignIcon,
  ArrowDown01Icon,
  ArrowUp01Icon,
  ArrowDown02Icon,
  ArrowUp02Icon,
  ListViewIcon,
  DashboardSquare01Icon,
} from "@hugeicons-pro/core-solid-rounded";
import { Card } from "./types";
import { toast } from "sonner";
import { deleteCardImages, deleteExportedFolder } from "./utils/imageStorage";
import { invoke } from "@tauri-apps/api/core";
import { Tooltip } from "./components/Tooltip";
import { useContextMenu } from "./components/ContextMenu";
import CustomSelect from "./components/CustomSelect";
import StoredImage from "./components/StoredImage";

function getDragImagePaths(images: string[], exportedPath?: string): string[] {
  const storedPaths = images.filter((src) => !src.startsWith("data:"));
  if (storedPaths.length === images.length) return storedPaths;
  if (!exportedPath) return storedPaths;
  return images.map((src, index) => {
    const match = src.match(/data:image\/([a-zA-Z]+);/);
    const ext = match ? match[1] : "jpeg";
    return `${exportedPath}\\${index + 1}.${ext}`;
  });
}

export default function HomePage() {
  const router = useRouter();
  const { cards, deleteCard, updateCard, moveCardToBottom, settings, updateSettings, ready } = useStore();
  const [mounted, setMounted] = useState(false);
  const [deleteId, setDeleteId] = useState<string | null>(null);
  const [filterField, setFilterField] = useState<"addTime" | "category">("addTime");
  const [filterCategory, setFilterCategory] = useState("");
  const [searchQuery, setSearchQuery] = useState("");
  const [orderDirection, setOrderDirection] = useState<"desc" | "asc">("desc");
  const [page, setPage] = useState(1);
  const pageSize = 10;
  const viewMode = settings.viewMode ?? "card";
  const setViewMode = (v: "card" | "table") => updateSettings({ viewMode: v });

  useEffect(() => {
    setMounted(true);
  }, []);

  const handleCopyText = async (card: Card) => {
    const fullText = settings.useEndText && settings.endText ? `${card.text}\n\n${settings.endText}` : card.text;
    try {
      await navigator.clipboard.writeText(fullText);
      toast.success("Text copied to clipboard!");
    } catch (err) {
      toast.error("Failed to copy text.");
    }
  };

  const confirmDelete = async () => {
    if (deleteId) {
      try {
        await deleteCardImages(deleteId);
        const cardToDelete = cards.find((c) => c.id === deleteId);
        if (cardToDelete?.exportedPath) {
          await deleteExportedFolder(cardToDelete.exportedPath);
        }
      } catch (err) {
        console.error("Failed to delete images from disk", err);
      }
      deleteCard(deleteId);
      setDeleteId(null);
      toast.success("Card deleted");
    }
  };

  const handleWheel = (e: React.WheelEvent<HTMLDivElement>) => {
    if (e.deltaY !== 0) {
      e.currentTarget.scrollLeft += e.deltaY;
    }
  };

  const { ContextMenu } = useContextMenu({
    onAddCard: () => router.push("/create"),
    onRefresh: () => window.location.reload(),
    onEditCard: (id) => router.push(`/edit?id=${id}`),
    onDeleteCard: (id) => setDeleteId(id),
  });

  const filteredCards = cards.filter(c => {
    const matchCat = filterField === "category" && filterCategory ? c.category === filterCategory : true;
    const normalizedQuery = searchQuery.trim().toLowerCase();
    const matchSearch = normalizedQuery ? `${c.text || ""} ${c.category || ""}`.toLowerCase().includes(normalizedQuery) : true;
    return matchCat && matchSearch;
  });

  const sortedCards = [...filteredCards].sort((a, b) => {
    const aOrder = a.sortOrder ?? a.createdAt;
    const bOrder = b.sortOrder ?? b.createdAt;
    return orderDirection === "desc" ? bOrder - aOrder : aOrder - bOrder;
  });

  const pageCount = Math.max(1, Math.ceil(sortedCards.length / pageSize));
  const visibleCards = sortedCards.slice((page - 1) * pageSize, page * pageSize);

  useEffect(() => { setPage(1); }, [filterField, filterCategory, searchQuery, orderDirection, viewMode]);
  useEffect(() => { if (page > pageCount) setPage(pageCount); }, [page, pageCount]);

  if (!mounted || !ready) return null;

  return (
    <motion.div
      initial={{ opacity: 0 }}
      animate={{ opacity: 1 }}
      exit={{ opacity: 0 }}
      transition={{ duration: 0.3, ease: [0.25, 0.1, 0.25, 1] }}
      className="flex flex-col gap-6 w-full flex-1 min-h-full"
    >
      {ContextMenu}
      <div className="flex flex-col lg:flex-row lg:items-center gap-2 w-full">
        <div className="flex items-center gap-2 w-full lg:flex-1 lg:min-w-0 p-1 rounded-[var(--radius-xl)] bg-[var(--surface)] border border-[var(--border)]">
          <span className="px-2 text-xs font-semibold text-[var(--muted-foreground)]">Filter:</span>
          <CustomSelect className="flex-1" value={filterField} onChange={(value) => { setFilterField(value as "addTime" | "category"); if (value === "addTime") setFilterCategory(""); }} options={[{ value: "addTime", label: "Add time" }, { value: "category", label: "Category" }]} />
          <CustomSelect className="flex-1" disabled={filterField !== "category"} value={filterCategory} onChange={setFilterCategory} options={[{ value: "", label: "All categories" }, ...(settings.categories || []).map((category) => ({ value: category, label: category }))]} />
          <button type="button" onClick={() => setOrderDirection((value) => value === "desc" ? "asc" : "desc")} className="flex items-center justify-center h-8 w-9 shrink-0 rounded-[var(--radius-md)] bg-[var(--input)] text-[var(--foreground)] hover:bg-[var(--muted)]" aria-label={orderDirection === "desc" ? "Descending order" : "Ascending order"}>
            <HugeiconsIcon icon={orderDirection === "desc" ? ArrowDown02Icon : ArrowUp02Icon} size={16} />
          </button>
        </div>

        <div className="flex flex-row items-center gap-2 w-full lg:w-auto lg:shrink-0">
          {/* View toggle */}
          <div className="flex items-center shrink-0 bg-[var(--surface)] border border-[var(--border)] rounded-[var(--radius-xl)] p-0.5 shadow-sm">
            <Tooltip content="Card View">
              <button
                onClick={() => setViewMode("card")}
                className={`flex items-center justify-center w-8 h-8 rounded-[var(--radius-lg)] transition-all ${
                  viewMode === "card"
                    ? "bg-[var(--primary)] text-white shadow-sm"
                    : "text-[var(--muted-foreground)] hover:text-[var(--foreground)]"
                }`}
              >
                <HugeiconsIcon icon={DashboardSquare01Icon} size={15} />
              </button>
            </Tooltip>
            <Tooltip content="Table View">
              <button
                onClick={() => setViewMode("table")}
                className={`flex items-center justify-center w-8 h-8 rounded-[var(--radius-lg)] transition-all ${
                  viewMode === "table"
                    ? "bg-[var(--primary)] text-white shadow-sm"
                    : "text-[var(--muted-foreground)] hover:text-[var(--foreground)]"
                }`}
              >
                <HugeiconsIcon icon={ListViewIcon} size={15} />
              </button>
            </Tooltip>
          </div>

          <div className="relative flex-1 min-w-0">
            <HugeiconsIcon icon={Search01Icon} size={16} className="absolute left-3 top-1/2 -translate-y-1/2 text-[var(--muted-foreground)]" />
            <input
              type="text"
              placeholder="Search cards..."
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              className="w-full h-9 pl-9 pr-3 rounded-[var(--radius-xl)] bg-[var(--surface)] border border-[var(--border)] text-xs text-[var(--foreground)] placeholder-[var(--muted-foreground)] focus:outline-none focus:border-[var(--primary)] focus:ring-1 focus:ring-[var(--primary)] transition-all shadow-sm"
            />
            {searchQuery && (
              <button type="button" onClick={() => setSearchQuery("")} aria-label="Clear search" className="absolute right-2 top-1/2 -translate-y-1/2 h-6 w-6 rounded-full text-sm text-[var(--muted-foreground)] hover:bg-[var(--muted)] hover:text-[var(--foreground)]">×</button>
            )}
          </div>
        </div>
      </div>

      <div className="flex items-center justify-between -mt-3 text-[11px] text-[var(--muted-foreground)]">
        <span>{sortedCards.length} result{sortedCards.length === 1 ? "" : "s"}</span>
        {(searchQuery || filterCategory || filterField !== "addTime" || orderDirection !== "desc") && (
          <button type="button" onClick={() => { setSearchQuery(""); setFilterField("addTime"); setFilterCategory(""); setOrderDirection("desc"); }} className="flex items-center gap-1 text-[var(--primary)] hover:underline">
            <HugeiconsIcon icon={Cancel01Icon} size={13} />
            Clear filters
          </button>
        )}
      </div>

      {sortedCards.length === 0 ? (
        <motion.div
          initial={false}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.4, ease: [0.25, 0.1, 0.25, 1] }}
          className="flex flex-col items-center justify-center h-[60vh] gap-4 opacity-50"
        >
          <HugeiconsIcon icon={Search01Icon} size={48} className="text-[var(--muted-foreground)]" />
          <p className="text-sm font-medium text-[var(--muted-foreground)]">No cards yet. Create one!</p>
        </motion.div>
      ) : viewMode === "card" ? (
        <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 lg:grid-cols-4 xl:grid-cols-5 gap-4 sm:gap-6">
          <AnimatePresence>
            {visibleCards.map((card) => {
              const fullImages = card.images;
              const dateObj = new Date(card.createdAt);
              const dateStr = dateObj.toLocaleDateString("en-GB", { day: '2-digit', month: 'short', year: 'numeric' });
              const timeStr = dateObj.toLocaleTimeString("en-GB", { hour: '2-digit', minute: '2-digit' });
              
              return (
                            <motion.div
                              key={card.id}
                              layout
                              initial={false}
                              animate={{ opacity: 1 }}
                              whileHover={{ y: -2, transition: { duration: 0.1 } }}
                              data-card-id={card.id}
                              className="bg-[var(--card)] rounded-[var(--radius-xl)] overflow-hidden shadow-sm border border-[var(--border)] flex flex-col transition-shadow duration-200 hover:shadow-md"
                            >
                              <div className="relative aspect-video bg-[var(--input)] flex items-center justify-center overflow-hidden">
                                {fullImages.length > 0 ? (
                    <StoredImage 
                      src={fullImages[0]} 
                      alt="Preview" 
                      className="w-full h-full object-cover"
                    />
                                ) : (
                                  <HugeiconsIcon icon={Image02Icon} size={24} className="text-[var(--muted-foreground)]" />
                                )}
                                {fullImages.length > 1 && (
                                  <div className="absolute bottom-2 right-2 bg-black/60 backdrop-blur-md px-2 py-1 rounded-full text-[10px] font-bold text-white shadow-sm pointer-events-none">
                                    +{fullImages.length - 1}
                                  </div>
                                )}
                                {card.category && (
                                  <span className="absolute top-2 left-2 px-2 py-1 bg-[var(--background)]/80 backdrop-blur-md rounded-[var(--radius-sm)] text-[10px] font-bold text-[var(--foreground)] z-10 pointer-events-none">
                                    {card.category}
                                  </span>
                                )}
                              </div>

                <div className="p-4 flex-1 flex flex-col gap-2">

                  <div className="flex items-start gap-2">
                    <div className="flex-1 flex flex-col gap-1.5">
                      <span className="text-[10px] text-[var(--muted-foreground)] font-medium">
                        {dateStr} • {timeStr}
                      </span>
                      <p className="text-xs text-[var(--card-foreground)] line-clamp-3 whitespace-pre-wrap">
                        {card.text || "No details provided."}
                      </p>
                    </div>
                    <div className="flex flex-col gap-0.5 shrink-0">
                      <Tooltip content="Edit">
                        <button
                          onClick={() => router.push(`/edit?id=${card.id}`)}
                          className="p-1.5 rounded-[var(--radius-md)] hover:bg-[var(--muted)] text-[var(--muted-foreground)] hover:text-[var(--foreground)] transition-colors duration-200"
                          aria-label="Edit"
                        >
                          <HugeiconsIcon icon={Edit01Icon} size={15} />
                        </button>
                      </Tooltip>
                      <Tooltip content="Delete">
                        <button
                          onClick={() => setDeleteId(card.id)}
                          className="p-1.5 rounded-[var(--radius-md)] hover:bg-[var(--danger)]/10 text-[var(--muted-foreground)] hover:text-[var(--danger)] transition-colors duration-200"
                          aria-label="Delete"
                        >
                          <HugeiconsIcon icon={Delete01Icon} size={15} />
                        </button>
                      </Tooltip>
                    </div>
                  </div>

                  <div className="mt-auto pt-3 flex items-center justify-center gap-2 border-t border-[var(--border)]">
                      <div className="flex items-center gap-1 bg-[var(--surface)] border border-[var(--border)] rounded-md p-0.5 shadow-sm h-9">
                        <button 
                          onClick={() => updateCard(card.id, { count: Math.max(0, (card.count || 0) - 1) })} 
                          className="w-7 h-full flex items-center justify-center hover:bg-[var(--background)] hover:shadow-sm rounded cursor-pointer text-[var(--muted-foreground)] hover:text-[var(--foreground)] transition-all"
                        >
                          <HugeiconsIcon icon={MinusSignIcon} size={14} />
                        </button>
                        <span className="text-[13px] font-bold min-w-[20px] text-center text-[var(--foreground)] tabular-nums">{card.count || 0}</span>
                        <button 
                          onClick={() => updateCard(card.id, { count: (card.count || 0) + 1 })} 
                          className="w-7 h-full flex items-center justify-center hover:bg-[var(--background)] hover:shadow-sm rounded cursor-pointer text-[var(--muted-foreground)] hover:text-[var(--foreground)] transition-all"
                        >
                          <HugeiconsIcon icon={PlusSignIcon} size={14} />
                        </button>
                      </div>

                      <Tooltip content="To Bottom">
                            <button
                              onClick={() => void moveCardToBottom(card.id, orderDirection)}
                          className="w-7 h-9 flex items-center justify-center rounded-md bg-[var(--surface)] border border-[var(--border)] hover:bg-[var(--background)] active:scale-90 text-[var(--muted-foreground)] hover:text-[var(--foreground)] transition-all shadow-sm"
                          aria-label="Move to bottom"
                        >
                            <motion.span animate={{ y: [0, 2, 0] }} transition={{ duration: 0.7, ease: "easeInOut" }}>
                              <HugeiconsIcon icon={ArrowDown01Icon} size={16} />
                            </motion.span>
                        </button>
                      </Tooltip>

                      {!fullImages.length ? (
                      <div className="flex items-center gap-1">
                        <Tooltip content="Copy">
                          <button
                            onClick={() => handleCopyText(card)}
                            className="p-2 rounded-[var(--radius-md)] hover:bg-[var(--muted)] text-[var(--muted-foreground)] hover:text-[var(--foreground)] transition-colors duration-200"
                            aria-label="Copy Text"
                          >
                            <HugeiconsIcon icon={TextSquareIcon} size={18} />
                          </button>
                        </Tooltip>
                      </div>
                    ) : (
                      <div className="flex items-center gap-0.5 bg-[var(--surface)] border border-[var(--border)] rounded-[var(--radius-lg)] px-1 py-0.5">
                        <Tooltip content="Drag image">
                          <button
                            draggable={true}
                            onDragStart={async (e) => {
                              e.preventDefault();
                              try {
                                const imagePaths = getDragImagePaths(fullImages, card.exportedPath);
                                if (!imagePaths.length) return;
                                await invoke("start_drag", { paths: imagePaths });
                              } catch (err) {
                                console.error("Native drag failed", err);
                              }
                            }}
                            className="p-2 rounded-[var(--radius-md)] hover:bg-[var(--muted)] text-[var(--muted-foreground)] hover:text-[var(--foreground)] transition-colors duration-200 cursor-grab active:cursor-grabbing"
                            aria-label="Drag image"
                          >
                            <HugeiconsIcon icon={Image02Icon} size={18} />
                          </button>
                        </Tooltip>
                        <Tooltip content="Copy text">
                          <button
                            onClick={() => handleCopyText(card)}
                            className="p-2 rounded-[var(--radius-md)] hover:bg-[var(--muted)] text-[var(--muted-foreground)] hover:text-[var(--foreground)] transition-colors duration-200"
                            aria-label="Copy text"
                          >
                            <HugeiconsIcon icon={TextSquareIcon} size={18} />
                          </button>
                        </Tooltip>
                      </div>
                      )}
                  </div>
                </div>
              </motion.div>
            )})}
          </AnimatePresence>
        </div>
      ) : viewMode === "table" ? (
        <div className="w-full overflow-x-auto rounded-[var(--radius-xl)] border border-[var(--border)] bg-[var(--card)] shadow-sm">
          <table className="w-full text-xs">
            <thead>
              <tr className="border-b border-[var(--border)] bg-[var(--surface)]">
                <th className="text-left px-4 py-3 font-semibold text-[var(--muted-foreground)] w-10">#</th>
                <th className="text-left px-4 py-3 font-semibold text-[var(--muted-foreground)]">Image</th>
                <th className="text-left px-4 py-3 font-semibold text-[var(--muted-foreground)]">Details</th>
                <th className="text-left px-4 py-3 font-semibold text-[var(--muted-foreground)]">Category</th>
                <th className="text-left px-4 py-3 font-semibold text-[var(--muted-foreground)]">Date</th>
                <th className="text-left px-4 py-3 font-semibold text-[var(--muted-foreground)]">Count</th>
                <th className="px-4 py-3 font-semibold text-[var(--muted-foreground)]">Actions</th>
              </tr>
            </thead>
            <tbody>
              <AnimatePresence>
                {visibleCards.map((card, index) => {
                  const fullImages = card.images;
                  const dateObj = new Date(card.createdAt);
                  const dateStr = dateObj.toLocaleDateString("en-GB", { day: "2-digit", month: "short", year: "numeric" });
                  const timeStr = dateObj.toLocaleTimeString("en-GB", { hour: "2-digit", minute: "2-digit" });
                  return (
                    <motion.tr
                      key={card.id}
                      layout
                      initial={false}
                      data-card-id={card.id}
                      className="border-b border-[var(--border)] last:border-0 hover:bg-[var(--surface)] transition-colors group"
                    >
                      <td className="px-4 py-3 text-[var(--muted-foreground)] font-mono">{index + 1}</td>
                      <td className="px-4 py-3">
                        {fullImages.length > 0 ? (
                          <StoredImage src={fullImages[0]} alt="" className="w-10 h-10 object-cover rounded-[var(--radius-md)]" />
                        ) : (
                          <div className="w-10 h-10 rounded-[var(--radius-md)] bg-[var(--input)] flex items-center justify-center">
                            <HugeiconsIcon icon={Image02Icon} size={16} className="text-[var(--muted-foreground)]" />
                          </div>
                        )}
                      </td>
                      <td className="px-4 py-3 max-w-[240px]">
                        <p className="text-[var(--foreground)] line-clamp-2 whitespace-pre-wrap">{card.text || "—"}</p>
                      </td>
                      <td className="px-4 py-3">
                        {card.category ? (
                          <span className="px-2 py-0.5 bg-[var(--input)] rounded-full text-[var(--foreground)] font-medium">{card.category}</span>
                        ) : <span className="text-[var(--muted-foreground)]">—</span>}
                      </td>
                      <td className="px-4 py-3 text-[var(--muted-foreground)] whitespace-nowrap">{dateStr}<br/><span className="text-[10px]">{timeStr}</span></td>
                      <td className="px-4 py-3">
                        <div className="flex items-center gap-1 bg-[var(--surface)] border border-[var(--border)] rounded-md p-0.5 w-fit">
                          <button onClick={() => updateCard(card.id, { count: Math.max(0, (card.count || 0) - 1) })} className="w-5 h-5 flex items-center justify-center hover:bg-[var(--background)] rounded text-[var(--muted-foreground)] hover:text-[var(--foreground)] transition-all">
                            <HugeiconsIcon icon={MinusSignIcon} size={11} />
                          </button>
                          <span className="text-[12px] font-bold min-w-[16px] text-center text-[var(--foreground)] tabular-nums">{card.count || 0}</span>
                          <button onClick={() => updateCard(card.id, { count: (card.count || 0) + 1 })} className="w-5 h-5 flex items-center justify-center hover:bg-[var(--background)] rounded text-[var(--muted-foreground)] hover:text-[var(--foreground)] transition-all">
                            <HugeiconsIcon icon={PlusSignIcon} size={11} />
                          </button>
                        </div>
                      </td>
                      <td className="px-4 py-3">
                        <div className="flex items-center gap-1 opacity-0 group-hover:opacity-100 transition-opacity">
                          <Tooltip content="Edit">
                            <button onClick={() => router.push(`/edit?id=${card.id}`)} className="p-1.5 rounded-[var(--radius-md)] hover:bg-[var(--muted)] text-[var(--muted-foreground)] hover:text-[var(--foreground)] transition-colors">
                              <HugeiconsIcon icon={Edit01Icon} size={14} />
                            </button>
                          </Tooltip>
                          <Tooltip content="Delete">
                            <button onClick={() => setDeleteId(card.id)} className="p-1.5 rounded-[var(--radius-md)] hover:bg-[var(--danger)]/10 text-[var(--muted-foreground)] hover:text-[var(--danger)] transition-colors">
                              <HugeiconsIcon icon={Delete01Icon} size={14} />
                            </button>
                          </Tooltip>
                          <Tooltip content="To Bottom">
                            <button onClick={() => void moveCardToBottom(card.id, orderDirection)} className="p-1.5 rounded-[var(--radius-md)] hover:bg-[var(--muted)] active:scale-90 text-[var(--muted-foreground)] hover:text-[var(--foreground)] transition-colors">
                              <motion.span animate={{ y: [0, 2, 0] }} transition={{ duration: 0.7, ease: "easeInOut" }}>
                                <HugeiconsIcon icon={ArrowDown01Icon} size={14} />
                              </motion.span>
                            </button>
                          </Tooltip>

                          {!fullImages.length ? (
                            <>
                              <Tooltip content="Copy">
                                <button onClick={() => handleCopyText(card)} className="p-1.5 rounded-[var(--radius-md)] hover:bg-[var(--muted)] text-[var(--muted-foreground)] hover:text-[var(--foreground)] transition-colors">
                                  <HugeiconsIcon icon={TextSquareIcon} size={14} />
                                </button>
                              </Tooltip>
                            </>
                          ) : (
                            <>
                              <Tooltip content="Drag image">
                                <button
                                  draggable={true}
                                  onDragStart={async (e) => {
                                    e.preventDefault();
                                    try {
                                      const imagePaths = getDragImagePaths(fullImages, card.exportedPath);
                                      if (!imagePaths.length) return;
                                      await invoke("start_drag", { paths: imagePaths });
                                    } catch (err) {
                                      console.error("Native drag failed", err);
                                    }
                                  }}
                                  className="p-1.5 rounded-[var(--radius-md)] hover:bg-[var(--muted)] text-[var(--muted-foreground)] hover:text-[var(--foreground)] transition-colors cursor-grab active:cursor-grabbing"
                                >
                                  <HugeiconsIcon icon={Image02Icon} size={14} />
                                </button>
                              </Tooltip>
                              <Tooltip content="Copy text">
                                <button
                                  onClick={() => handleCopyText(card)}
                                  className="p-1.5 rounded-[var(--radius-md)] hover:bg-[var(--muted)] text-[var(--muted-foreground)] hover:text-[var(--foreground)] transition-colors"
                                >
                                  <HugeiconsIcon icon={TextSquareIcon} size={14} />
                                </button>
                              </Tooltip>
                            </>
                          )}
                        </div>
                      </td>
                    </motion.tr>
                  );
                })}
              </AnimatePresence>
            </tbody>
          </table>
        </div>
      ) : null}

      {sortedCards.length > pageSize && (
        <div className="flex items-center justify-center gap-3 pt-2">
          <button type="button" disabled={page === 1} onClick={() => setPage((value) => Math.max(1, value - 1))} className="h-9 px-4 rounded-[var(--radius-lg)] border border-[var(--border)] text-xs text-[var(--foreground)] disabled:opacity-40">Previous</button>
          <span className="text-xs text-[var(--muted-foreground)]">Page {page} / {pageCount}</span>
          <button type="button" disabled={page === pageCount} onClick={() => setPage((value) => Math.min(pageCount, value + 1))} className="h-9 px-4 rounded-[var(--radius-lg)] border border-[var(--border)] text-xs text-[var(--foreground)] disabled:opacity-40">Next</button>
        </div>
      )}

      <AnimatePresence>
      {deleteId && (
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            transition={{ duration: 0.18 }}
            className="fixed inset-0 z-[99999] bg-black/50 backdrop-blur-[6px] flex items-center justify-center p-4"
          >
            <motion.div
              initial={{ scale: 0.93, opacity: 0, y: 12 }}
              animate={{ scale: 1, opacity: 1, y: 0 }}
              exit={{ scale: 0.95, opacity: 0, y: 8 }}
              transition={{ type: "spring", stiffness: 380, damping: 28, mass: 0.8 }}
              className="bg-[var(--card)] p-6 rounded-[var(--radius-xl)] w-full max-w-sm border border-[var(--border)] shadow-2xl flex flex-col gap-4"
            >
              <h3 className="text-lg font-bold text-[var(--foreground)]">Delete Card</h3>
              <p className="text-sm text-[var(--muted-foreground)]">Are you sure you want to delete this card? This action cannot be undone.</p>
              <div className="flex items-center justify-end gap-2 mt-2">
                <button
                  onClick={() => setDeleteId(null)}
                  className="h-11 px-5 rounded-[var(--radius-xl)] text-sm font-medium text-[var(--foreground)] hover:bg-[var(--muted)] transition-colors duration-200"
                >
                  Cancel
                </button>
                <button
                  onClick={confirmDelete}
                  className="h-11 px-5 rounded-[var(--radius-xl)] text-sm font-bold bg-[var(--danger)] hover:brightness-110 text-[var(--primary-foreground)] transition-all duration-200"
                >
                  Delete
                </button>
              </div>
            </motion.div>
          </motion.div>
      )}
      </AnimatePresence>


    </motion.div>
  );
}
