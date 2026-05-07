web標準の方法
```
  <CardContent>
    <form id="form-rhf-demo" ...>  ← ここでformが閉じる
      ...
    </form>
  </CardContent>
  <CardFooter>
    {/* form の外にあるが... */}
    <Button type="submit" form="form-rhf-demo">  ← IDで紐づける 
```