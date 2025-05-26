<?xml version="1.0" encoding="UTF-8"?>
<xsl:stylesheet version="1.0"
  xmlns:xsl="http://www.w3.org/1999/XSL/Transform">
  <xsl:template match="/">
    <html>
    <head><title>Exported Tasks</title></head>
    <body>
      <h2>Smart Study Hub – Tasks</h2>
      <table border="1">
        <tr>
          <th>Title</th><th>Description</th><th>Category</th><th>Deadline</th><th>Status</th>
        </tr>
        <xsl:for-each select="tasks/task">
          <tr>
            <td><xsl:value-of select="title"/></td>
            <td><xsl:value-of select="description"/></td>
            <td><xsl:value-of select="category"/></td>
            <td><xsl:value-of select="deadline"/></td>
            <td><xsl:value-of select="status"/></td>
          </tr>
        </xsl:for-each>
      </table>
    </body>
    </html>
  </xsl:template>
</xsl:stylesheet>
