import { test, expect } from "@playwright/test";

test.describe("마크다운 에디터 — Tip 작성 페이지", () => {
  test.beforeEach(async ({ page }) => {
    await page.goto("/tips/new");
  });

  test("작성/미리보기 탭이 존재한다", async ({ page }) => {
    await expect(page.getByRole("tab", { name: "작성" })).toBeVisible();
    await expect(page.getByRole("tab", { name: "미리보기" })).toBeVisible();
  });

  test("마크다운 툴바 버튼이 표시된다", async ({ page }) => {
    await expect(page.getByTitle("굵게 (Ctrl+B)")).toBeVisible();
    await expect(page.getByTitle("기울임 (Ctrl+I)")).toBeVisible();
    await expect(page.getByTitle("코드")).toBeVisible();
    await expect(page.getByTitle("링크")).toBeVisible();
    await expect(page.getByTitle("목록")).toBeVisible();
    await expect(page.getByTitle("번호 목록")).toBeVisible();
  });

  test("미리보기 탭에서 마크다운이 렌더링된다", async ({ page }) => {
    const textarea = page.locator("textarea");
    await textarea.fill("# 제목\n\n**굵은 텍스트**\n\n- 항목 1\n- 항목 2");

    await page.getByRole("tab", { name: "미리보기" }).click();

    // h1 제목이 렌더링되는지 확인
    await expect(page.locator("h1").filter({ hasText: "제목" })).toBeVisible();
    // bold 텍스트가 strong 태그로 렌더링되는지 확인
    await expect(page.locator("strong").filter({ hasText: "굵은 텍스트" })).toBeVisible();
    // 리스트가 렌더링되는지 확인
    await expect(page.locator("li").filter({ hasText: "항목 1" })).toBeVisible();
  });

  test("미리보기 내용이 없으면 안내 메시지가 표시된다", async ({ page }) => {
    await page.getByRole("tab", { name: "미리보기" }).click();
    await expect(page.getByText("미리보기할 내용이 없습니다")).toBeVisible();
  });

  test("미리보기 탭에서 툴바가 숨겨진다", async ({ page }) => {
    await page.getByRole("tab", { name: "미리보기" }).click();
    await expect(page.getByTitle("굵게 (Ctrl+B)")).not.toBeVisible();
  });

  test("굵게 툴바 버튼이 **텍스트**를 삽입한다", async ({ page }) => {
    const textarea = page.locator("textarea");
    await textarea.click();
    await page.getByTitle("굵게 (Ctrl+B)").click();
    await expect(textarea).toHaveValue("**텍스트**");
  });

  test("기울임 툴바 버튼이 *텍스트*를 삽입한다", async ({ page }) => {
    const textarea = page.locator("textarea");
    await textarea.click();
    await page.getByTitle("기울임 (Ctrl+I)").click();
    await expect(textarea).toHaveValue("*텍스트*");
  });

  test("코드 툴바 버튼이 `코드`를 삽입한다", async ({ page }) => {
    const textarea = page.locator("textarea");
    await textarea.click();
    await page.getByTitle("코드").click();
    await expect(textarea).toHaveValue("`코드`");
  });

  test("링크 툴바 버튼이 [링크 텍스트](url)를 삽입한다", async ({ page }) => {
    const textarea = page.locator("textarea");
    await textarea.click();
    await page.getByTitle("링크").click();
    await expect(textarea).toHaveValue("[링크 텍스트](url)");
  });

  test("목록 툴바 버튼이 - 를 삽입한다", async ({ page }) => {
    const textarea = page.locator("textarea");
    await textarea.click();
    await page.getByTitle("목록").click();
    await expect(textarea).toHaveValue("- ");
  });

  test("번호 목록 툴바 버튼이 1. 를 삽입한다", async ({ page }) => {
    const textarea = page.locator("textarea");
    await textarea.click();
    await page.getByTitle("번호 목록").click();
    await expect(textarea).toHaveValue("1. ");
  });

  test("Ctrl+B 단축키로 굵게 삽입된다", async ({ page }) => {
    const textarea = page.locator("textarea");
    await textarea.click();
    await textarea.press("Meta+b");
    await expect(textarea).toHaveValue("**텍스트**");
  });

  test("GFM 테이블이 미리보기에서 렌더링된다", async ({ page }) => {
    const textarea = page.locator("textarea");
    await textarea.fill(
      "| 이름 | 나이 |\n| --- | --- |\n| 홍길동 | 30 |",
    );

    await page.getByRole("tab", { name: "미리보기" }).click();
    await expect(page.locator("table")).toBeVisible();
    await expect(page.locator("th").filter({ hasText: "이름" })).toBeVisible();
    await expect(page.locator("td").filter({ hasText: "홍길동" })).toBeVisible();
  });

  test("코드블록이 미리보기에서 렌더링된다", async ({ page }) => {
    const textarea = page.locator("textarea");
    await textarea.fill("```js\nconsole.log('hello');\n```");

    await page.getByRole("tab", { name: "미리보기" }).click();
    await expect(page.locator("pre")).toBeVisible();
    await expect(page.locator("code")).toContainText("console.log");
  });
});

test.describe("마크다운 에디터 — Project 작성 페이지", () => {
  test.beforeEach(async ({ page }) => {
    await page.goto("/projects/new");
  });

  test("프로젝트 폼에 작성/미리보기 탭이 존재한다", async ({ page }) => {
    await expect(page.getByRole("tab", { name: "작성" })).toBeVisible();
    await expect(page.getByRole("tab", { name: "미리보기" })).toBeVisible();
  });

  test("프로젝트 폼에 마크다운 툴바가 표시된다", async ({ page }) => {
    await expect(page.getByTitle("굵게 (Ctrl+B)")).toBeVisible();
  });

  test("프로젝트 미리보기에서 마크다운이 렌더링된다", async ({ page }) => {
    const textarea = page.locator("textarea");
    await textarea.fill("## 프로젝트 설명\n\n**핵심 기능**입니다.");

    await page.getByRole("tab", { name: "미리보기" }).click();

    await expect(
      page.locator("h2").filter({ hasText: "프로젝트 설명" }),
    ).toBeVisible();
    await expect(
      page.locator("strong").filter({ hasText: "핵심 기능" }),
    ).toBeVisible();
  });
});
