"use client";

import { useState } from "react";
import { api } from "~/trpc/react";
import { Button } from "~/components/ui/button";
import { Card, CardContent } from "~/components/ui/card";
import { Input } from "~/components/ui/input";
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogFooter,
} from "~/components/ui/dialog";
import {
  ChevronDown,
  ChevronRight,
  Plus,
  Pencil,
  Trash2,
} from "lucide-react";
import { cn } from "~/lib/utils";

type TopCategoryForm = {
  name: string;
  slug: string;
  icon: string;
  sortOrder: number;
};

type CategoryForm = {
  name: string;
  slug: string;
  description: string;
  icon: string;
  sortOrder: number;
  topCategoryId: string;
};

const emptyTopForm: TopCategoryForm = { name: "", slug: "", icon: "", sortOrder: 0 };
const emptyCatForm: CategoryForm = {
  name: "",
  slug: "",
  description: "",
  icon: "",
  sortOrder: 0,
  topCategoryId: "",
};

export default function AdminCategoriesPage() {
  const utils = api.useUtils();
  const { data: topCategories = [] } = api.admin.getCategories.useQuery();

  const [expanded, setExpanded] = useState<Set<string>>(new Set());

  // Top category dialog state
  const [topDialogOpen, setTopDialogOpen] = useState(false);
  const [editingTopId, setEditingTopId] = useState<string | null>(null);
  const [topForm, setTopForm] = useState<TopCategoryForm>(emptyTopForm);

  // Category dialog state
  const [catDialogOpen, setCatDialogOpen] = useState(false);
  const [editingCatId, setEditingCatId] = useState<string | null>(null);
  const [catForm, setCatForm] = useState<CategoryForm>(emptyCatForm);

  const invalidate = () => {
    void utils.admin.getCategories.invalidate();
    void utils.category.getTopCategories.invalidate();
  };

  const createTop = api.admin.createTopCategory.useMutation({ onSuccess: () => { invalidate(); setTopDialogOpen(false); } });
  const updateTop = api.admin.updateTopCategory.useMutation({ onSuccess: () => { invalidate(); setTopDialogOpen(false); } });
  const deleteTop = api.admin.deleteTopCategory.useMutation({ onSuccess: invalidate });

  const createCat = api.admin.createCategory.useMutation({ onSuccess: () => { invalidate(); setCatDialogOpen(false); } });
  const updateCat = api.admin.updateCategory.useMutation({ onSuccess: () => { invalidate(); setCatDialogOpen(false); } });
  const deleteCat = api.admin.deleteCategory.useMutation({ onSuccess: invalidate });

  const toggle = (id: string) => {
    setExpanded((prev) => {
      const next = new Set(prev);
      if (next.has(id)) next.delete(id);
      else next.add(id);
      return next;
    });
  };

  const openCreateTop = () => {
    setEditingTopId(null);
    setTopForm(emptyTopForm);
    setTopDialogOpen(true);
  };

  const openEditTop = (tc: { id: string; name: string; slug: string; icon: string | null; sortOrder: number }) => {
    setEditingTopId(tc.id);
    setTopForm({ name: tc.name, slug: tc.slug, icon: tc.icon ?? "", sortOrder: tc.sortOrder });
    setTopDialogOpen(true);
  };

  const openCreateCat = (topCategoryId: string) => {
    setEditingCatId(null);
    setCatForm({ ...emptyCatForm, topCategoryId });
    setCatDialogOpen(true);
  };

  const openEditCat = (cat: {
    id: string;
    name: string;
    slug: string;
    description: string | null;
    icon: string | null;
    sortOrder: number;
    topCategoryId: string;
  }) => {
    setEditingCatId(cat.id);
    setCatForm({
      name: cat.name,
      slug: cat.slug,
      description: cat.description ?? "",
      icon: cat.icon ?? "",
      sortOrder: cat.sortOrder,
      topCategoryId: cat.topCategoryId,
    });
    setCatDialogOpen(true);
  };

  const handleTopSubmit = () => {
    const data = {
      name: topForm.name,
      slug: topForm.slug,
      icon: topForm.icon || undefined,
      sortOrder: topForm.sortOrder,
    };
    if (editingTopId) {
      updateTop.mutate({ id: editingTopId, ...data });
    } else {
      createTop.mutate(data);
    }
  };

  const handleCatSubmit = () => {
    const data = {
      name: catForm.name,
      slug: catForm.slug,
      description: catForm.description || undefined,
      icon: catForm.icon || undefined,
      sortOrder: catForm.sortOrder,
      topCategoryId: catForm.topCategoryId,
    };
    if (editingCatId) {
      updateCat.mutate({ id: editingCatId, ...data });
    } else {
      createCat.mutate(data);
    }
  };

  const topMutating = createTop.isPending || updateTop.isPending;
  const catMutating = createCat.isPending || updateCat.isPending;

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <h1 className="text-2xl font-bold">카테고리 관리</h1>
        <Button size="sm" onClick={openCreateTop}>
          <Plus className="mr-1 h-4 w-4" />
          상위 카테고리 추가
        </Button>
      </div>

      <div className="space-y-3">
        {topCategories.map((tc) => {
          const isOpen = expanded.has(tc.id);
          const childTipCount = tc.categories.reduce((s, c) => s + c._count.tips, 0);
          const hasChildren = tc.categories.length > 0;

          return (
            <Card key={tc.id}>
              <CardContent className="p-0">
                {/* Top category row */}
                <div className="flex items-center gap-3 px-4 py-3">
                  <button
                    onClick={() => toggle(tc.id)}
                    className="shrink-0 rounded p-1 hover:bg-muted"
                  >
                    {isOpen ? (
                      <ChevronDown className="h-4 w-4" />
                    ) : (
                      <ChevronRight className="h-4 w-4" />
                    )}
                  </button>
                  <div className="flex-1 min-w-0">
                    <div className="flex items-center gap-2">
                      {tc.icon && <span>{tc.icon}</span>}
                      <span className="font-medium">{tc.name}</span>
                      <span className="text-xs text-muted-foreground">
                        ({tc.slug})
                      </span>
                      <span className="text-xs text-muted-foreground">
                        · 하위 {tc.categories.length}개 · 팁 {childTipCount}개
                      </span>
                    </div>
                  </div>
                  <div className="flex items-center gap-1 shrink-0">
                    <span className="text-xs text-muted-foreground mr-2">
                      순서 {tc.sortOrder}
                    </span>
                    <Button
                      size="icon-sm"
                      variant="ghost"
                      onClick={() => openEditTop(tc)}
                    >
                      <Pencil className="h-3.5 w-3.5" />
                    </Button>
                    <Button
                      size="icon-sm"
                      variant="ghost"
                      className={cn(
                        hasChildren && "opacity-30 cursor-not-allowed",
                        !hasChildren && "text-destructive hover:text-destructive",
                      )}
                      disabled={hasChildren || deleteTop.isPending}
                      onClick={() => {
                        if (confirm(`"${tc.name}" 상위 카테고리를 삭제하시겠습니까?`)) {
                          deleteTop.mutate({ id: tc.id });
                        }
                      }}
                      title={hasChildren ? "하위 카테고리가 있어 삭제 불가" : "삭제"}
                    >
                      <Trash2 className="h-3.5 w-3.5" />
                    </Button>
                  </div>
                </div>

                {/* Sub-categories */}
                {isOpen && (
                  <div className="border-t bg-muted/20 px-4 py-2 space-y-1">
                    {tc.categories.map((cat) => {
                      const hasTips = cat._count.tips > 0;
                      return (
                        <div
                          key={cat.id}
                          className="flex items-center gap-3 rounded-md px-3 py-2 hover:bg-muted/50"
                        >
                          <div className="flex-1 min-w-0">
                            <div className="flex items-center gap-2">
                              {cat.icon && <span>{cat.icon}</span>}
                              <span className="text-sm font-medium">{cat.name}</span>
                              <span className="text-xs text-muted-foreground">
                                ({cat.slug})
                              </span>
                              <span className="text-xs text-muted-foreground">
                                · 팁 {cat._count.tips}개
                              </span>
                            </div>
                            {cat.description && (
                              <p className="mt-0.5 text-xs text-muted-foreground truncate">
                                {cat.description}
                              </p>
                            )}
                          </div>
                          <div className="flex items-center gap-1 shrink-0">
                            <span className="text-xs text-muted-foreground mr-2">
                              순서 {cat.sortOrder}
                            </span>
                            <Button
                              size="icon-sm"
                              variant="ghost"
                              onClick={() => openEditCat(cat)}
                            >
                              <Pencil className="h-3.5 w-3.5" />
                            </Button>
                            <Button
                              size="icon-sm"
                              variant="ghost"
                              className={cn(
                                hasTips && "opacity-30 cursor-not-allowed",
                                !hasTips && "text-destructive hover:text-destructive",
                              )}
                              disabled={hasTips || deleteCat.isPending}
                              onClick={() => {
                                if (confirm(`"${cat.name}" 카테고리를 삭제하시겠습니까?`)) {
                                  deleteCat.mutate({ id: cat.id });
                                }
                              }}
                              title={hasTips ? "팁이 있어 삭제 불가" : "삭제"}
                            >
                              <Trash2 className="h-3.5 w-3.5" />
                            </Button>
                          </div>
                        </div>
                      );
                    })}
                    <Button
                      variant="ghost"
                      size="sm"
                      className="w-full justify-start text-muted-foreground"
                      onClick={() => openCreateCat(tc.id)}
                    >
                      <Plus className="mr-1 h-3.5 w-3.5" />
                      하위 카테고리 추가
                    </Button>
                  </div>
                )}
              </CardContent>
            </Card>
          );
        })}

        {topCategories.length === 0 && (
          <p className="text-center text-muted-foreground py-8">
            카테고리가 없습니다.
          </p>
        )}
      </div>

      {/* Top category dialog */}
      <Dialog open={topDialogOpen} onOpenChange={setTopDialogOpen}>
        <DialogContent className="sm:max-w-md">
          <DialogHeader>
            <DialogTitle>
              {editingTopId ? "상위 카테고리 수정" : "상위 카테고리 추가"}
            </DialogTitle>
          </DialogHeader>
          <div className="space-y-3">
            <div>
              <label className="text-xs font-medium text-muted-foreground">이름</label>
              <Input
                value={topForm.name}
                onChange={(e) => setTopForm((f) => ({ ...f, name: e.target.value }))}
                placeholder="개발"
              />
            </div>
            <div>
              <label className="text-xs font-medium text-muted-foreground">슬러그</label>
              <Input
                value={topForm.slug}
                onChange={(e) => setTopForm((f) => ({ ...f, slug: e.target.value }))}
                placeholder="dev"
              />
            </div>
            <div>
              <label className="text-xs font-medium text-muted-foreground">아이콘 (이모지)</label>
              <Input
                value={topForm.icon}
                onChange={(e) => setTopForm((f) => ({ ...f, icon: e.target.value }))}
                placeholder="💻"
              />
            </div>
            <div>
              <label className="text-xs font-medium text-muted-foreground">정렬 순서</label>
              <Input
                type="number"
                min={0}
                value={topForm.sortOrder}
                onChange={(e) => setTopForm((f) => ({ ...f, sortOrder: parseInt(e.target.value) || 0 }))}
              />
            </div>
          </div>
          <DialogFooter>
            <Button
              onClick={handleTopSubmit}
              disabled={!topForm.name || !topForm.slug || topMutating}
            >
              {topMutating ? "저장 중..." : editingTopId ? "수정" : "추가"}
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      {/* Category dialog */}
      <Dialog open={catDialogOpen} onOpenChange={setCatDialogOpen}>
        <DialogContent className="sm:max-w-md">
          <DialogHeader>
            <DialogTitle>
              {editingCatId ? "카테고리 수정" : "카테고리 추가"}
            </DialogTitle>
          </DialogHeader>
          <div className="space-y-3">
            <div>
              <label className="text-xs font-medium text-muted-foreground">이름</label>
              <Input
                value={catForm.name}
                onChange={(e) => setCatForm((f) => ({ ...f, name: e.target.value }))}
                placeholder="Frontend"
              />
            </div>
            <div>
              <label className="text-xs font-medium text-muted-foreground">슬러그</label>
              <Input
                value={catForm.slug}
                onChange={(e) => setCatForm((f) => ({ ...f, slug: e.target.value }))}
                placeholder="frontend"
              />
            </div>
            <div>
              <label className="text-xs font-medium text-muted-foreground">설명</label>
              <Input
                value={catForm.description}
                onChange={(e) => setCatForm((f) => ({ ...f, description: e.target.value }))}
                placeholder="프론트엔드 관련 팁"
              />
            </div>
            <div>
              <label className="text-xs font-medium text-muted-foreground">아이콘 (이모지)</label>
              <Input
                value={catForm.icon}
                onChange={(e) => setCatForm((f) => ({ ...f, icon: e.target.value }))}
                placeholder="⚛️"
              />
            </div>
            <div>
              <label className="text-xs font-medium text-muted-foreground">정렬 순서</label>
              <Input
                type="number"
                min={0}
                value={catForm.sortOrder}
                onChange={(e) => setCatForm((f) => ({ ...f, sortOrder: parseInt(e.target.value) || 0 }))}
              />
            </div>
          </div>
          <DialogFooter>
            <Button
              onClick={handleCatSubmit}
              disabled={!catForm.name || !catForm.slug || catMutating}
            >
              {catMutating ? "저장 중..." : editingCatId ? "수정" : "추가"}
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </div>
  );
}
