import { test, expect, type Page } from '@playwright/test'

/** 清除 localStorage 语言偏好，确保从默认中文状态开始。 */
async function clearLangStorage(page: Page) {
  await page.goto('/')
  await page.evaluate(() => localStorage.removeItem('i18nextLng'))
}

/** 从首页绑定桌台并进入菜单页面。 */
async function enterMenu(page: Page) {
  await page.goto('/')
  await page.getByRole('button', { name: /A08/ }).first().click()
  await page.getByRole('button', { name: /进入点餐|Enter/ }).click()
}

test.describe('中英文语言切换 - E2E 验收测试', () => {
  test('LANG-001: 首次访问默认显示中文', async ({ page }) => {
    await clearLangStorage(page)
    await page.reload()
    // 绑定桌台页面应显示中文文案
    await expect(page.getByText('热气升腾，')).toBeVisible()
    await expect(page.getByText('好味即刻开场。')).toBeVisible()
    await expect(page.getByText('模拟门店')).toBeVisible()
    await expect(page.getByText('沸点 · 星河里店')).toBeVisible()
    // 桌台选项显示中文区域名
    await expect(page.getByText(/大厅/)).toBeVisible()
    // html lang 属性为 zh-CN
    await expect(page.locator('html')).toHaveAttribute('lang', 'zh-CN')
  })

  test('LANG-002: 切换到英文后所有关键文案立即更新', async ({ page }) => {
    await clearLangStorage(page)
    await enterMenu(page)
    // 确认中文模式下的文案
    await expect(page.getByText('概念演示 / 非官方 · 仅用于服务流程原型展示')).toBeVisible()
    await expect(page.getByRole('button', { name: '点餐' })).toBeVisible()
    // 点击语言切换按钮（中文模式下显示 "EN"）
    await page.getByRole('button', { name: '切换语言' }).click()
    // 验证英文文案立即更新
    await expect(page.getByText('Concept Demo / Unofficial · For service flow prototyping only')).toBeVisible()
    await expect(page.getByRole('button', { name: 'Menu' })).toBeVisible()
    await expect(page.getByRole('button', { name: 'Orders' })).toBeVisible()
    // 语言切换按钮现在显示 "中"
    await expect(page.getByRole('button', { name: 'Switch language' })).toContainText('中')
    // html lang 属性更新
    await expect(page.locator('html')).toHaveAttribute('lang', 'en')
  })

  test('LANG-003: 从英文切换回中文，文案恢复正确', async ({ page }) => {
    await clearLangStorage(page)
    await enterMenu(page)
    // 切换到英文
    await page.getByRole('button', { name: '切换语言' }).click()
    await expect(page.getByText('Concept Demo / Unofficial · For service flow prototyping only')).toBeVisible()
    // 切换回中文（英文模式下按钮显示 "中"）
    await page.getByRole('button', { name: 'Switch language' }).click()
    // 验证中文文案恢复
    await expect(page.getByText('概念演示 / 非官方 · 仅用于服务流程原型展示')).toBeVisible()
    await expect(page.getByRole('button', { name: '点餐' })).toBeVisible()
    await expect(page.getByRole('button', { name: '订单' })).toBeVisible()
    // 语言切换按钮恢复显示 "EN"
    await expect(page.getByRole('button', { name: '切换语言' })).toContainText('EN')
    // html lang 属性恢复
    await expect(page.locator('html')).toHaveAttribute('lang', 'zh-CN')
  })

  test('LANG-004: 语言偏好持久化，刷新后保持上次选择的语言', async ({ page }) => {
    await clearLangStorage(page)
    await enterMenu(page)
    // 切换到英文
    await page.getByRole('button', { name: '切换语言' }).click()
    await expect(page.getByText('Concept Demo / Unofficial · For service flow prototyping only')).toBeVisible()
    // 验证 localStorage 已持久化
    const stored = await page.evaluate(() => localStorage.getItem('i18nextLng'))
    expect(stored).toBe('en')
    // 刷新页面 — 应用状态重置到绑定桌台页面，但语言偏好保留
    await page.reload()
    // 绑定桌台页面应显示英文文案
    await expect(page.getByText('Steam rising,')).toBeVisible()
    await expect(page.getByText('great flavors begin now.')).toBeVisible()
    await expect(page.getByText('Simulated Store')).toBeVisible()
    // html lang 属性为 en
    await expect(page.locator('html')).toHaveAttribute('lang', 'en')
  })

  test('LANG-005: 老人模式按钮 aria-label 随语言切换更新', async ({ page }) => {
    await clearLangStorage(page)
    await enterMenu(page)
    // 中文模式下老人模式按钮 aria-label 为中文
    const elderlyBtnZh = page.locator('button[aria-label="切换至老人模式"]')
    await expect(elderlyBtnZh).toBeVisible()
    // 切换到英文
    await page.getByRole('button', { name: '切换语言' }).click()
    await expect(page.getByText('Concept Demo / Unofficial · For service flow prototyping only')).toBeVisible()
    // 英文模式下老人模式按钮 aria-label 为英文
    const elderlyBtnEn = page.locator('button[aria-label="Switch to elderly mode"]')
    await expect(elderlyBtnEn).toBeVisible()
    // 切换回中文
    await page.getByRole('button', { name: 'Switch language' }).click()
    await expect(elderlyBtnZh).toBeVisible()
  })

  test('LANG-006: 语言切换不影响老人模式开关状态和提示文案语言', async ({ page }) => {
    await clearLangStorage(page)
    await enterMenu(page)
    // 开启老人模式（中文提示）
    const elderlyBtn = page.locator('button[aria-label="切换至老人模式"]')
    await elderlyBtn.click()
    // 验证中文提示消息
    await expect(page.getByText('已切换为老人模式')).toBeVisible()
    // 老人模式按钮现在显示"切换至常规模式"
    await expect(page.locator('button[aria-label="切换至常规模式"]')).toBeVisible()
    // 切换到英文
    await page.getByRole('button', { name: '切换语言' }).click()
    await expect(page.getByText('Concept Demo / Unofficial · For service flow prototyping only')).toBeVisible()
    // 老人模式仍处于开启状态（按钮 aria-label 为英文的 "Switch to standard mode"）
    await expect(page.locator('button[aria-label="Switch to standard mode"]')).toBeVisible()
    // 关闭老人模式（英文提示）
    await page.locator('button[aria-label="Switch to standard mode"]').click()
    await expect(page.getByText('Switched to standard mode')).toBeVisible()
  })
})
