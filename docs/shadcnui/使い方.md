## リンクの作り方
buttonVariantsを使うと見た目を適用することができる
```tsx
      <Link href="/about" className={buttonVariants({
        variant: "ghost"
      })}>aboutへ</Link>
```

## base uiではasChildは使えない。
renderPropで置き換える

```tsx
      <DropdownMenuTrigger
        render={(props) => (
          <Button {...props} variant="outline" size="icon">
            <Sun className="h-[1.2rem] w-[1.2rem] scale-100 rotate-0 transition-all dark:scale-0 dark:-rotate-90" />
            <Moon className="absolute h-[1.2rem] w-[1.2rem] scale-0 rotate-90 transition-all dark:scale-100 dark:rotate-0" />
            <span className="sr-only">Toggle theme</span>
          </Button>
        )}
      />
```